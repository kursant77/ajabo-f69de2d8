
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { type Order } from "@/data/deliveryData";
import { toast } from "sonner";
import { notifyTelegramBot } from "@/lib/telegram";

// Define a type that matches the Supabase DB structure (snake_case)
type DBOrder = {
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
};

export function useSupabaseOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to map DB row to App Order type
    const mapToAppOrder = (row: DBOrder): any => ({
        id: row.id,
        productName: row.product_name,
        quantity: row.quantity,
        customerName: row.customer_name,
        phoneNumber: row.phone_number,
        status: row.status as any,
        address: row.address,
        createdAt: new Date(row.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        rawCreatedAt: new Date(row.created_at),
        totalPrice: row.total_price || 0,
        deliveryPerson: row.delivery_person || undefined,
        telegramUserId: row.telegram_user_id || null,
    });

    // Helper to map App updates to DB structure
    const mapToDBUpdates = (updates: Partial<any>): Partial<DBOrder> => {
        const dbUpdates: Partial<DBOrder> = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.deliveryPerson) dbUpdates.delivery_person = updates.deliveryPerson;
        if (updates.telegramUserId) dbUpdates.telegram_user_id = updates.telegramUserId;
        // Add other fields as needed
        return dbUpdates;
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setOrders(data.map(mapToAppOrder));
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Buyurtmalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        console.log('🔌 Setting up real-time subscription for orders...');

        const channel = supabase
            .channel("orders_channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    console.log('📡 Real-time event received:', payload.eventType, payload);

                    if (payload.eventType === "INSERT") {
                        console.log('✅ New order inserted:', payload.new);
                        setOrders((prev) => {
                            const newOrder = mapToAppOrder(payload.new as DBOrder);
                            console.log('📦 Adding order to state:', newOrder);
                            return [newOrder, ...prev];
                        });
                    } else if (payload.eventType === "UPDATE") {
                        console.log('🔄 Order updated:', payload.new);
                        setOrders((prev) =>
                            prev.map((order) =>
                                order.id === payload.new.id ? mapToAppOrder(payload.new as DBOrder) : order
                            )
                        );
                    } else if (payload.eventType === "DELETE") {
                        console.log('🗑️ Order deleted:', payload.old);
                        setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                console.log('📊 Subscription status:', status);
            });

        return () => {
            console.log('🔌 Removing real-time subscription...');
            supabase.removeChannel(channel);
        };
    }, []);

    const updateOrder = useCallback(async (orderId: string, updates: any) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update(mapToDBUpdates(updates))
                .eq("id", orderId);

            if (error) throw error;

            // Notify Telegram bot if status changed and user has telegram ID
            const updatedOrder = orders.find(o => o.id === orderId);
            if (updatedOrder && updatedOrder.telegramUserId && updates.status) {
                // Map status to telegram bot expected status
                let botStatus: any = updates.status;
                if (updates.status === "on_way") botStatus = "delivering";
                if (updates.status === "pending") botStatus = "confirmed";

                await notifyTelegramBot({
                    order_id: orderId,
                    telegram_user_id: updatedOrder.telegramUserId,
                    status: botStatus
                });
            }
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Buyurtmani yangilashda xatolik");
        }
    }, []);

    const addOrder = useCallback(async (order: Omit<Order, "id">) => {
        try {
            const dbOrder = {
                product_name: order.productName,
                quantity: order.quantity,
                customer_name: order.customerName,
                phone_number: order.phoneNumber,
                status: order.status,
                address: order.address,
                total_price: order.totalPrice,
                telegram_user_id: (order as any).telegramUserId || null,
                // created_at defaults to now()
            };

            const { data, error } = await supabase.from("orders").insert(dbOrder).select().single();
            if (error) throw error;

            // Notify Telegram bot for new order
            if (data && data.telegram_user_id) {
                await notifyTelegramBot({
                    order_id: data.id,
                    telegram_user_id: data.telegram_user_id,
                    status: "confirmed"
                });
            }
        } catch (error) {
            console.error("Error adding order:", error);
            toast.error("Buyurtma qo'shishda xatolik");
        }
    }, []);

    return { orders, loading, updateOrder, addOrder };
}
