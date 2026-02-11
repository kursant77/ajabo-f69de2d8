
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PRODUCT_IMAGES_BUCKET = "product-images";

/** Upload a file to product-images bucket and return public URL. */
export async function uploadProductImage(file: File): Promise<string> {
    try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(path, file, { upsert: true });

        if (error) {
            console.error("Storage upload error:", error);
            if (error.message.includes("Bucket not found")) {
                toast.error("Xatolik: 'product-images' bucketi topilmadi. Supabase dashboardda yaratilganiga ishonch hosil qiling.");
            } else {
                toast.error(`Rasm yuklashda xatolik: ${error.message}`);
            }
            throw error;
        }

        const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
        return data.publicUrl;
    } catch (error: any) {
        console.error("uploadProductImage unexpected error:", error);
        throw error;
    }
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    is_available?: boolean;
}

export function useSupabaseProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) throw error;
            setProducts(data as Product[]);
        } catch (error) {
            console.error("Error fetching products:", error);
            // toast.error("Menyuni yuklashda xatolik"); // Suppress error toast on load to avoid spam if just net glitch
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel("products_channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setProducts((prev) => [...prev, payload.new as Product]);
                    } else if (payload.eventType === "UPDATE") {
                        setProducts((prev) =>
                            prev.map((item) => (item.id === payload.new.id ? (payload.new as Product) : item))
                        );
                    } else if (payload.eventType === "DELETE") {
                        setProducts((prev) => prev.filter((item) => item.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addProduct = async (product: Omit<Product, "id">): Promise<string | undefined> => {
        try {
            const { data, error } = await supabase.from("products").insert(product).select("id").single();
            if (error) throw error;
            toast.success("Mahsulot qo'shildi");
            return data?.id;
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Xatolik yuz berdi");
            return undefined;
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const { error } = await supabase.from("products").update(updates).eq("id", id);
            if (error) throw error;
            toast.success("Mahsulot yangilandi");
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
            toast.success("Mahsulot o'chirildi");
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    /** Get ingredients for a product (warehouse_product_id, quantity). */
    const getProductIngredients = async (productId: string): Promise<{ warehouse_product_id: string; quantity: number }[]> => {
        const { data, error } = await supabase
            .from("product_ingredients")
            .select("warehouse_product_id, quantity")
            .eq("product_id", productId);
        if (error) return [];
        return (data || []).map((r) => ({ warehouse_product_id: r.warehouse_product_id, quantity: Number(r.quantity) }));
    };

    /** Replace all ingredients for a product (delete existing, insert new). */
    const setProductIngredients = async (
        productId: string,
        items: { warehouse_product_id: string; quantity: number }[]
    ): Promise<void> => {
        await supabase.from("product_ingredients").delete().eq("product_id", productId);
        if (items.length === 0) return;
        await supabase.from("product_ingredients").insert(
            items.map((item) => ({
                product_id: productId,
                warehouse_product_id: item.warehouse_product_id,
                quantity: item.quantity,
            }))
        );
    };

    return { products, loading, addProduct, updateProduct, deleteProduct, getProductIngredients, setProductIngredients };
}
