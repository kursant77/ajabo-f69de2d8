import { useState, useEffect } from "react";
import {
  Save,
  Store,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Truck,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Settings2,
  Globe,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSupabaseSettings, CafeSettings } from "@/hooks/useSupabaseSettings";
import { cn } from "@/lib/utils";
import { CashLogo, ClickLogo, PaymeLogo, PaynetLogo, UzumLogo } from "@/components/payment/PaymentLogos";
import { toast } from "sonner";

const AdminSettings = () => {
  const { settings, loading, updateSettings } = useSupabaseSettings();
  const [localSettings, setLocalSettings] = useState<CafeSettings | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "delivery" | "payments">("general");
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      // Success toast is handled in the hook
    } catch (error) {
      console.error(error);
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !localSettings) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="animate-pulse font-medium text-muted-foreground">Sozlamalar yuklanmoqda...</p>
      </div>
    );
  }

  const sections = [
    { id: "general", label: "Umumiy", icon: <Store className="h-4 w-4" /> },
    { id: "delivery", label: "Yetkazib berish", icon: <Truck className="h-4 w-4" /> },
    { id: "payments", label: "To'lovlar", icon: <CreditCard className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Sozlamalar</h1>
          <p className="text-muted-foreground">Kafe ma'lumotlari va tizim parametrlarini boshqarish</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          O'zgarishlarni saqlash
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 font-bold transition-all",
              activeTab === section.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-white text-muted-foreground border border-slate-100 hover:bg-slate-50"
            )}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "general" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile card */}
              <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40 md:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Asosiy ma'lumotlar</h3>
                    <p className="text-sm text-muted-foreground">Mijozlarga ko'rinadigan umumiy ma'lumotlar</p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Kafe nomi</label>
                    <Input
                      value={localSettings.cafe_name}
                      onChange={(e) => setLocalSettings({ ...localSettings, cafe_name: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Telefon</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={localSettings.phone}
                        onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 transition-all focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Manzil</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={localSettings.address}
                        onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 transition-all focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Qisqacha tavsif (SEO)</label>
                    <Textarea
                      value={localSettings.description}
                      onChange={(e) => setLocalSettings({ ...localSettings, description: e.target.value })}
                      placeholder="Qisqacha ma'lumot..."
                      className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 p-4 transition-all focus:bg-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Working hours */}
              <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Ish vaqti</h3>
                    <p className="text-sm text-muted-foreground">Ochilish va yopilish vaqtlari</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Ochilish</label>
                    <Input
                      type="time"
                      value={localSettings.open_time}
                      onChange={(e) => setLocalSettings({ ...localSettings, open_time: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Yopilish</label>
                    <Input
                      type="time"
                      value={localSettings.close_time}
                      onChange={(e) => setLocalSettings({ ...localSettings, close_time: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sayt holati</h3>
                    <p className="text-sm text-muted-foreground">Veb-sayt umumiy parametrlari</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Online</p>
                      <p className="text-xs text-emerald-800/70">Mijozlar buyurtma berishni davom ettirishlari mumkin.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40">
              <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Yetkazib berish sozlamalari</h3>
                    <p className="text-sm text-muted-foreground">Narxlar va limitlarni boshqarish</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.delivery_enabled}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, delivery_enabled: checked })}
                  className="scale-125 data-[state=checked]:bg-primary"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Minimal buyurtma summasi</label>
                    <p className="text-xs text-muted-foreground mb-2">Bu summadan past buyurtmalarni tizim qabul qilmaydi.</p>
                    <div className="relative">
                      <Input
                        type="number"
                        value={localSettings.min_order_amount}
                        onChange={(e) => setLocalSettings({ ...localSettings, min_order_amount: Number(e.target.value) })}
                        className="h-14 rounded-xl border-slate-200 bg-slate-50/50 pr-12 text-lg font-bold transition-all focus:bg-white"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">so'm</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Yetkazib berish narxi</label>
                    <p className="text-xs text-muted-foreground mb-2">Har bir yetkazib berish uchun standart narx (Hozircha bepul ✨).</p>
                    <div className="relative">
                      <Input
                        type="number"
                        value={localSettings.delivery_fee}
                        onChange={(e) => setLocalSettings({ ...localSettings, delivery_fee: Number(e.target.value) })}
                        className="h-14 rounded-xl border-slate-200 bg-slate-50/50 pr-12 text-lg font-bold transition-all focus:bg-white"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">so'm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Ma'lumot uchun</h4>
                    <p className="text-sm leading-relaxed text-blue-800/80 mt-1">
                      Agar "Yetkazib berishni yoqish" o'chirilsa, Checkout sahifasida faqat "Olib ketish" va "Bron qilish" opsiyalari qoladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-8">
              <div className="rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40">
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">To'lov tizimlari</h3>
                    <p className="text-sm text-muted-foreground">Mavjud to'lov usullarini yoqish yoki o'chirish</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Cash Toggle */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
                    localSettings.payment_cash_enabled ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-white"
                  )}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-8 flex items-center">
                        <CashLogo className="h-6 w-auto" />
                      </div>
                      <Switch
                        checked={localSettings.payment_cash_enabled}
                        onCheckedChange={(checked) => setLocalSettings({ ...localSettings, payment_cash_enabled: checked })}
                      />
                    </div>
                    <div>
                      <p className="font-bold">Naqd pul</p>
                      <p className="text-xs text-muted-foreground">Yetkazilganda to'lash</p>
                    </div>
                  </div>

                  {/* Click Toggle */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
                    localSettings.payment_click_enabled ? "border-sky-200 bg-sky-50/30" : "border-slate-100 bg-white"
                  )}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-8 flex items-center">
                        <ClickLogo className="h-6 w-auto" />
                      </div>
                      <Switch
                        checked={localSettings.payment_click_enabled}
                        onCheckedChange={(checked) => setLocalSettings({ ...localSettings, payment_click_enabled: checked })}
                      />
                    </div>
                    <div>
                      <p className="font-bold">Click</p>
                      <p className="text-xs text-muted-foreground">Click Up ilovasi orqali</p>
                    </div>
                  </div>

                  {/* Payme Toggle */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
                    localSettings.payment_payme_enabled ? "border-teal-200 bg-teal-50/30" : "border-slate-100 bg-white"
                  )}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-8 flex items-center">
                        <PaymeLogo className="h-6 w-auto" />
                      </div>
                      <Switch
                        checked={localSettings.payment_payme_enabled}
                        onCheckedChange={(checked) => setLocalSettings({ ...localSettings, payment_payme_enabled: checked })}
                      />
                    </div>
                    <div>
                      <p className="font-bold">Payme</p>
                      <p className="text-xs text-muted-foreground">Payme ilovasi orqali</p>
                    </div>
                  </div>

                  {/* Uzum Toggle */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
                    localSettings.payment_uzum_enabled ? "border-violet-200 bg-violet-50/30" : "border-slate-100 bg-white"
                  )}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-8 flex items-center">
                        <UzumLogo className="h-6 w-auto" />
                      </div>
                      <Switch
                        checked={localSettings.payment_uzum_enabled}
                        onCheckedChange={(checked) => setLocalSettings({ ...localSettings, payment_uzum_enabled: checked })}
                      />
                    </div>
                    <div>
                      <p className="font-bold">Uzum Bank</p>
                      <p className="text-xs text-muted-foreground">Uzum ilovasi orqali</p>
                    </div>
                  </div>

                  {/* Paynet Toggle */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
                    localSettings.payment_paynet_enabled ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 bg-white"
                  )}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-8 flex items-center">
                        <PaynetLogo className="h-6 w-auto" />
                      </div>
                      <Switch
                        checked={localSettings.payment_paynet_enabled}
                        onCheckedChange={(checked) => setLocalSettings({ ...localSettings, payment_paynet_enabled: checked })}
                      />
                    </div>
                    <div>
                      <p className="font-bold">Paynet</p>
                      <p className="text-xs text-muted-foreground">Paynet ilovasi orqali</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Eslatma</p>
                      <p className="text-xs text-amber-800/70">Xavfsizlik uchun kamida bitta to'lov usuli yoqilgan bo'lishi shart.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;
