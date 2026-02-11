
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface WarehouseProduct {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    min_quantity: number;
    created_at?: string;
    updated_at?: string;
}

export function useSupabaseWarehouse() {
    const [items, setItems] = useState<WarehouseProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableExists, setTableExists] = useState(true);

    const fetchWarehouse = async () => {
        try {
            const { data, error } = await supabase
                .from("warehouse_products")
                .select("*")
                .order("name", { ascending: true });

            if (error) {
                if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
                    setTableExists(false);
                    setItems([]);
                    return;
                }
                throw error;
            }
            setItems((data as WarehouseProduct[]) || []);
        } catch (error) {
            console.error("Error fetching warehouse products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouse();
    }, []);

    const addProductType = async (params: { name: string; unit: string; min_quantity?: number }) => {
        if (!tableExists) {
            toast.error("Avval ma'lumotlar bazasida warehouse_products jadvalini yarating");
            return;
        }
        try {
            const { error } = await supabase.from("warehouse_products").insert({
                name: params.name.trim(),
                unit: params.unit || "dona",
                min_quantity: params.min_quantity ?? 0,
                quantity: 0,
            });
            if (error) throw error;
            await fetchWarehouse();
            toast.success("Tavar qo'shildi");
        } catch (error) {
            console.error("Error adding warehouse product type:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const addStock = async (id: string, amount: number) => {
        if (!tableExists) {
            toast.error("Avval ma'lumotlar bazasida warehouse_products jadvalini yarating");
            return;
        }
        if (amount <= 0) {
            toast.error("Miqdor 0 dan katta bo'lishi kerak");
            return;
        }
        try {
            const item = items.find((i) => i.id === id);
            if (!item) {
                toast.error("Tavar topilmadi");
                return;
            }
            const newQuantity = item.quantity + amount;
            const { error } = await supabase
                .from("warehouse_products")
                .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            await fetchWarehouse();
            toast.success(`Omborhonaga ${amount} qo'shildi`);
        } catch (error) {
            console.error("Error adding stock:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const updateProductType = async (id: string, updates: Partial<Pick<WarehouseProduct, "name" | "unit" | "min_quantity">>) => {
        if (!tableExists) {
            toast.error("Avval ma'lumotlar bazasida warehouse_products jadvalini yarating");
            return;
        }
        try {
            const { error } = await supabase
                .from("warehouse_products")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            await fetchWarehouse();
            toast.success("Tavar yangilandi");
        } catch (error) {
            console.error("Error updating warehouse product:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const deleteProductType = async (id: string) => {
        if (!tableExists) {
            toast.error("Avval ma'lumotlar bazasida warehouse_products jadvalini yarating");
            return;
        }
        try {
            const { error } = await supabase.from("warehouse_products").delete().eq("id", id);
            if (error) throw error;
            await fetchWarehouse();
            toast.success("Tavar o'chirildi");
        } catch (error) {
            console.error("Error deleting warehouse product:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    return {
        items,
        loading,
        tableExists,
        fetchWarehouse,
        addProductType,
        addStock,
        updateProductType,
        deleteProductType,
    };
}
