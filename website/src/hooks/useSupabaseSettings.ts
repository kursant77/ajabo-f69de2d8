
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CafeSettings {
    cafe_name: string;
    address: string;
    phone: string;
    open_time: string;
    close_time: string;
    delivery_enabled: boolean;
    min_order_amount: number;
    delivery_fee: number;
    description: string;
    // Payment method toggles
    payment_cash_enabled: boolean;
    payment_click_enabled: boolean;
    payment_payme_enabled: boolean;
    payment_uzum_enabled: boolean;
    payment_paynet_enabled: boolean;
}

const DEFAULT_SETTINGS: CafeSettings = {
    cafe_name: "Ajabo Coffee",
    address: "Toshkent shahar, Amir Temur ko'chasi 108",
    phone: "+998 71 123 45 67",
    open_time: "08:00",
    close_time: "22:00",
    delivery_enabled: true,
    min_order_amount: 30000,
    delivery_fee: 10000,
    description: "Eng mazali kofe va taomlar sizni kutmoqda!",
    payment_cash_enabled: true,
    payment_click_enabled: true,
    payment_payme_enabled: true,
    payment_uzum_enabled: true,
    payment_paynet_enabled: true,
};

export function useSupabaseSettings() {
    const [settings, setSettings] = useState<CafeSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from("settings")
                .select("*")
                .eq("id", 1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Settings row doesn't exist, use defaults
                    return;
                }
                throw error;
            }

            if (data) {
                setSettings({
                    cafe_name: data.cafe_name || DEFAULT_SETTINGS.cafe_name,
                    address: data.address || DEFAULT_SETTINGS.address,
                    phone: data.phone || DEFAULT_SETTINGS.phone,
                    open_time: data.open_time ? data.open_time.substring(0, 5) : DEFAULT_SETTINGS.open_time,
                    close_time: data.close_time ? data.close_time.substring(0, 5) : DEFAULT_SETTINGS.close_time,
                    delivery_enabled: data.delivery_enabled ?? DEFAULT_SETTINGS.delivery_enabled,
                    min_order_amount: data.min_order_amount ?? DEFAULT_SETTINGS.min_order_amount,
                    delivery_fee: data.delivery_fee ?? DEFAULT_SETTINGS.delivery_fee,
                    description: data.description || DEFAULT_SETTINGS.description,
                    payment_cash_enabled: data.payment_cash_enabled ?? DEFAULT_SETTINGS.payment_cash_enabled,
                    payment_click_enabled: data.payment_click_enabled ?? DEFAULT_SETTINGS.payment_click_enabled,
                    payment_payme_enabled: data.payment_payme_enabled ?? DEFAULT_SETTINGS.payment_payme_enabled,
                    payment_uzum_enabled: data.payment_uzum_enabled ?? DEFAULT_SETTINGS.payment_uzum_enabled,
                    payment_paynet_enabled: data.payment_paynet_enabled ?? DEFAULT_SETTINGS.payment_paynet_enabled,
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (updates: Partial<CafeSettings>) => {
        try {
            // Remove the redundant .eq("id", 1) as upsert targets the primary key (id)
            const { error } = await supabase
                .from("settings")
                .upsert({ id: 1, ...updates });

            if (error) {
                console.error("Supabase settings error:", error);

                if (error.message?.includes("relation \"settings\" does not exist")) {
                    toast.error("Ma'lumotlar bazasida 'settings' jadvali topilmadi. SQLni ishlatishingiz kerak.");
                    return;
                }

                if (error.message?.includes("column") && error.message?.includes("does not exist")) {
                    toast.error("Jadvalda yangi ustunlar topilmadi. Iltimos, SUPABASE_SETUP.md dagi SQL skriptni qayta ishlating.", {
                        duration: 5000
                    });
                    return;
                }

                throw error;
            }

            setSettings(prev => ({ ...prev, ...updates }));
            toast.success("Sozlamalar saqlandi");
        } catch (error: any) {
            console.error("Error updating settings:", error);
            const msg = error.message || "Xatolik yuz berdi";
            toast.error(msg);
        }
    };

    return { settings, loading, updateSettings };
}
