
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { type Order } from "@/data/deliveryData";
import { toast } from "sonner";
import { notifyTelegramBot } from "@/lib/telegram";
import type { PaymentMethod } from "@/services/paymentService";

const isDev = import.meta.env.DEV;

// Define a type that matches the Supabase DB structure (snake_case)
interface DBOrder {
    id: string;
    product_name: string;
    quantity: number;
    customer_name: string;
    phone_number: string;
    status: string;
    address: string;
    created_at: string;
    total_price: number | null;
    delivery_person: string | null;
    telegram_user_id: number | null;
    order_type?: string;
    warehouse_deducted?: boolean;
    payment_method?: string;
}

/** Deduct order quantity from warehouse: by product_ingredients if product found; else fallback 1:1 by product_name. */
async function deductWarehouseForOrder(orderId: string, productName: string, quantity: number): Promise<void> {
    const name = (productName || "").trim();
    if (!name || quantity <= 0) return;
    try {
        const { data: product, error: productErr } = await supabase
            .from("products")
            .select("id")
            .ilike("name", name)
            .limit(1)
            .maybeSingle();
        if (!productErr && product?.id) {
            const { data: ingredients, error: ingErr } = await supabase
                .from("product_ingredients")
                .select("warehouse_product_id, quantity")
                .eq("product_id", product.id);
            if (!ingErr && ingredients && ingredients.length > 0) {
                for (const ing of ingredients) {
                    const { data: wp } = await supabase
                        .from("warehouse_products")
                        .select("id, quantity")
                        .eq("id", ing.warehouse_product_id)
                        .single();
                    if (wp) {
                        const deduct = Number(ing.quantity ?? 0) * quantity;
                        const newQty = Math.max(0, (wp.quantity ?? 0) - deduct);
                        await supabase
                            .from("warehouse_products")
                            .update({ quantity: newQty, updated_at: new Date().toISOString() })
                            .eq("id", ing.warehouse_product_id);
                    }
                }
                await supabase.from("orders").update({ warehouse_deducted: true }).eq("id", orderId);
                return;
            }
        }
        // Fallback: 1:1 by product_name
        const { data: wp, error: fetchErr } = await supabase
            .from("warehouse_products")
            .select("id, quantity")
            .ilike("name", name)
            .limit(1)
            .maybeSingle();
        if (fetchErr || !wp) return;
        const newQty = Math.max(0, (wp.quantity ?? 0) - quantity);
        await supabase
            .from("warehouse_products")
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq("id", wp.id);
        await supabase.from("orders").update({ warehouse_deducted: true }).eq("id", orderId);
    } catch {
        // warehouse_products / product_ingredients / warehouse_deducted may not exist
    }
}

// Helper to map DB row to App Order type
const mapToAppOrder = (row: DBOrder): Order => ({
    id: row.id,
    productName: row.product_name,
    quantity: row.quantity,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    status: row.status as Order["status"],
    address: row.address,
    createdAt: new Date(row.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    rawCreatedAt: new Date(row.created_at),
    totalPrice: row.total_price || 0,
    deliveryPerson: row.delivery_person || undefined,
    telegramUserId: row.telegram_user_id || null,
    orderType: (row.order_type as Order["orderType"]) || "delivery",
    paymentMethod: (row.payment_method as PaymentMethod) || undefined,
});

// Helper to map App updates to DB structure
const mapToDBUpdates = (updates: Partial<Order>): Partial<DBOrder> => {
    const dbUpdates: Partial<DBOrder> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.deliveryPerson !== undefined) dbUpdates.delivery_person = updates.deliveryPerson;
    if (updates.telegramUserId !== undefined) dbUpdates.telegram_user_id = updates.telegramUserId;
    if (updates.orderType !== undefined) dbUpdates.order_type = updates.orderType;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    return dbUpdates;
};

export function useSupabaseOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setOrders((data as DBOrder[]).map(mapToAppOrder));
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Buyurtmalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Cleanup expired pending_payment orders (older than 30 minutes)
        const cleanupExpiredOrders = async () => {
            try {
                const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
                const { data: expired } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("status", "pending_payment")
                    .lt("created_at", thirtyMinAgo);

                if (expired && expired.length > 0) {
                    const ids = expired.map((o: { id: string }) => o.id);
                    await supabase
                        .from("orders")
                        .update({ status: "cancelled" })
                        .in("id", ids);

                    if (isDev) console.log(`🗑️ Cancelled ${ids.length} expired pending_payment orders`);

                    // Remove from local state
                    setOrders((prev) => prev.filter((o) => !ids.includes(o.id) || o.status !== "pending_payment"));
                }
            } catch {
                // Silently ignore — cleanup is not critical
            }
        };

        cleanupExpiredOrders();
        if (isDev) console.log('🔌 Setting up real-time subscription for orders...');

        const channel = supabase
            .channel("orders_channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    if (isDev) console.log('📡 Real-time event:', payload.eventType);

                    if (payload.eventType === "INSERT") {
                        setOrders((prev) => {
                            const newOrder = mapToAppOrder(payload.new as DBOrder);
                            return [newOrder, ...prev];
                        });
                    } else if (payload.eventType === "UPDATE") {
                        setOrders((prev) =>
                            prev.map((order) =>
                                order.id === payload.new.id ? mapToAppOrder(payload.new as DBOrder) : order
                            )
                        );
                    } else if (payload.eventType === "DELETE") {
                        setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                if (isDev) console.log('📊 Subscription status:', status);
            });

        return () => {
            if (isDev) console.log('🔌 Removing real-time subscription...');
            supabase.removeChannel(channel);
        };
    }, []);

    const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
        try {
            const dbUpdates = mapToDBUpdates(updates);
            if (Object.keys(dbUpdates).length === 0) return;

            const { data, error } = await supabase
                .from("orders")
                .update(dbUpdates)
                .eq("id", orderId)
                .select()
                .single();

            if (error) throw error;

            // Notify Telegram bot if status changed and we have data
            if (data && updates.status && updates.status !== "pending_payment") {
                let telegramUserId = data.telegram_user_id;

                // If missing telegramUserId, try to look it up by phone number in profiles
                if (!telegramUserId && data.phone_number) {
                    if (isDev) console.log(`🔍 Looking up Telegram ID for phone: ${data.phone_number}`);
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("telegram_id")
                        .eq("phone", data.phone_number)
                        .single();

                    if (profileData) {
                        telegramUserId = profileData.telegram_id;
                    }
                }

                if (telegramUserId) {
                    // Map status to telegram bot expected status
                    let botStatus: string = updates.status || "";
                    if (updates.status === "on_way") botStatus = "delivering";
                    if (updates.status === "pending") botStatus = "confirmed";

                    await notifyTelegramBot({
                        order_id: orderId,
                        telegram_user_id: telegramUserId,
                        status: botStatus as "confirmed" | "ready" | "delivering" | "delivered",
                        product_name: data.product_name,
                        order_type: data.order_type
                    });
                }
            }

            // When status changes from pending_payment to confirmed/etc., deduct from warehouse once
            if (data && updates.status && updates.status !== "pending_payment" && !data.warehouse_deducted) {
                await deductWarehouseForOrder(data.id, data.product_name, data.quantity);
            }
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Buyurtmani yangilashda xatolik");
        }
    }, []); // ✅ No stale closure - removed `orders` from deps

    const addOrder = useCallback(async (order: Omit<Order, "id">) => {
        try {
            const dbOrder: Record<string, unknown> = {
                product_name: order.productName,
                quantity: order.quantity,
                customer_name: order.customerName,
                phone_number: order.phoneNumber,
                status: order.status,
                address: order.address,
                total_price: order.totalPrice,
                telegram_user_id: order.telegramUserId || null,
                order_type: order.orderType,
                payment_method: order.paymentMethod || null,
            };

            const { data, error } = await supabase.from("orders").insert(dbOrder).select().single();

            if (error) {
                // If the error is about a missing column, try inserting without order_type / payment_method
                if (error.message?.includes("column") && error.message?.includes("does not exist")) {
                    if (isDev) console.warn("⚠️ Column missing in DB. Retrying insert without optional columns...");
                    const { order_type, payment_method, ...fallbackOrder } = dbOrder;
                    const { data: retryData, error: retryError } = await supabase.from("orders").insert(fallbackOrder).select().single();
                    if (retryError) throw retryError;
                    return retryData?.id as string | undefined;
                }
                throw error;
            }

            // Notify Telegram bot for new order (ONLY IF NOT WAITING FOR PAYMENT)
            if (data && data.telegram_user_id && data.status !== "pending_payment") {
                await notifyTelegramBot({
                    order_id: data.id,
                    telegram_user_id: data.telegram_user_id,
                    status: "confirmed",
                    product_name: data.product_name,
                    order_type: data.order_type
                });
            }

            // Deduct from warehouse when order is not pending_payment (once per order)
            if (data && data.status !== "pending_payment") {
                await deductWarehouseForOrder(data.id, data.product_name, data.quantity);
            }

            return data?.id as string | undefined;
        } catch (error) {
            console.error("Error adding order:", error);
            toast.error("Buyurtma qo'shishda xatolik yuz berdi");
            return undefined;
        }
    }, []);

    return { orders, loading, updateOrder, addOrder };
}
