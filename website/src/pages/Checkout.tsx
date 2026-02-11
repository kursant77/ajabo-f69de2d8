import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    MapPin,
    ShoppingBag,
    Loader2,
    Check,
    Info,
    CreditCard,
    Truck,
    Clock,
    ArrowRight,
    ShieldCheck,
    Coffee,
    User,
    LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseProducts, type Product } from "@/hooks/useSupabaseProducts";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useSupabaseSettings } from "@/hooks/useSupabaseSettings";
import {
    isPaymentMethodConfigured,
    MIN_ORDER_AMOUNT,
    generatePaymentUrl,
    isOnlinePayment,
    checkRateLimit,
    validateOrderAmount,
    type PaymentMethod
} from "@/services/paymentService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CashLogo, ClickLogo, PaymeLogo, PaynetLogo, UzumLogo } from "@/components/payment/PaymentLogos";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import MenuSection from "@/components/MenuSection";

// Phone number validation (UZ format)
const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^\+?998\d{9}$/.test(cleaned) || /^\d{9}$/.test(cleaned);
};

const Checkout = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { products, loading: productsLoading } = useSupabaseProducts();
    const { addOrder, updateOrder } = useSupabaseOrders();
    const { settings, loading: settingsLoading } = useSupabaseSettings();

    const [product, setProduct] = useState<Product | null>(null);
    const [fullName, setFullName] = useState(() => localStorage.getItem("full_name") || "");
    const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem("phone") || "");
    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState(() => localStorage.getItem("last_address") || "");
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "preorder">("delivery");
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const telegramUserId = useMemo(() => {
        const saved = localStorage.getItem("telegram_user_id");
        return saved ? parseInt(saved, 10) : null;
    }, []);

    useEffect(() => {
        if (products.length > 0 && productId) {
            const found = products.find((p) => p.id === productId);
            if (found) {
                setProduct(found);
            } else {
                toast.error("Mahsulot topilmadi");
                navigate("/");
            }
        }
    }, [products, productId, navigate]);

    // Adjust order type if delivery is disabled
    useEffect(() => {
        if (!settingsLoading && !settings.delivery_enabled && orderType === "delivery") {
            setOrderType("takeaway");
        }
    }, [settings.delivery_enabled, settingsLoading, orderType]);

    const totalPrice = (product?.price || 0) * quantity;
    const isBelowMin = totalPrice < (settings?.min_order_amount || MIN_ORDER_AMOUNT);

    const isFormValid =
        (!!fullName.trim() && isValidPhone(phoneNumber)) &&
        (orderType !== "delivery" || address.trim().length >= 3) &&
        totalPrice >= (settings?.min_order_amount || MIN_ORDER_AMOUNT);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Brauzer joylashuvni qo'llab-quvvatlamaydi");
            return;
        }

        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setLocation(coords);
                setAddress(`Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
                setLoadingLocation(false);
                toast.success("Joylashuv olindi!");
            },
            () => {
                setLoadingLocation(false);
                toast.error("Joylashuvni olishda xatolik");
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting || !product) return;

        // Rate limit check
        const rateCheck = checkRateLimit();
        if (!rateCheck.allowed) {
            const seconds = Math.ceil(rateCheck.retryAfterMs / 1000);
            toast.warning(`Juda ko'p buyurtma berdingiz`, {
                description: `${seconds} soniyadan so'ng qayta urinib ko'ring.`,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Save info for next time
            localStorage.setItem("full_name", fullName);
            localStorage.setItem("phone", phoneNumber);
            localStorage.setItem("last_address", address);

            const isOnline = isOnlinePayment(paymentMethod);
            const initialStatus = isOnline ? "pending_payment" : "pending";

            const orderId = await addOrder({
                productName: product.name,
                quantity: quantity,
                customerName: fullName,
                phoneNumber: phoneNumber,
                address: address || "Manzil ko'rsatilmagan",
                status: initialStatus,
                createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
                rawCreatedAt: new Date(),
                totalPrice: totalPrice,
                telegramUserId: telegramUserId ?? undefined,
                orderType: orderType,
                paymentMethod: paymentMethod,
            });

            if (!orderId) throw new Error("Order creation failed");

            if (isOnline) {
                const paymentUrl = generatePaymentUrl(paymentMethod, {
                    orderId: orderId,
                    amount: totalPrice,
                    productName: product.name,
                    phoneNumber: phoneNumber,
                });

                if (paymentUrl) {
                    toast.info("To'lov sahifasiga yo'naltirilmoqda...");
                    setTimeout(() => {
                        window.location.href = paymentUrl;
                    }, 1000);
                } else {
                    toast.warning("To'lov tizimi sozlanmagan, buyurtma 'pending' holatiga o'tkazildi.");
                    await updateOrder(orderId, { status: "pending" });
                    navigate("/payment/success?order_id=" + orderId);
                }
            } else {
                toast.success("Buyurtmangiz qabul qilindi!");
                navigate("/payment/success?order_id=" + orderId);
            }
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
            toast.error("Xatolik yuz berdi");
        }
    };

    const allPaymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = useMemo(() => [
        { id: "cash", label: "Naqd", icon: <CashLogo className="h-5 w-auto" />, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
        { id: "click", label: "Click", icon: <ClickLogo className="h-5 w-auto" />, color: "border-sky-200 bg-sky-50 text-sky-700" },
        { id: "payme", label: "Payme", icon: <PaymeLogo className="h-5 w-auto" />, color: "border-teal-200 bg-teal-50 text-teal-700" },
        { id: "uzum", label: "Uzum Bank", icon: <UzumLogo className="h-5 w-auto" />, color: "border-violet-200 bg-violet-50 text-violet-700" },
        { id: "paynet", label: "Paynet", icon: <PaynetLogo className="h-5 w-auto" />, color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
    ], []);

    const paymentMethods = useMemo(() => {
        return allPaymentMethods.filter((m) => {
            const isConfigured = isPaymentMethodConfigured(m.id);
            if (!isConfigured) return false;

            // Check admin toggles
            if (!settings) return true; // Fallback to .env only if settings not loaded

            switch (m.id) {
                case "cash": return settings.payment_cash_enabled;
                case "click": return settings.payment_click_enabled;
                case "payme": return settings.payment_payme_enabled;
                case "uzum": return settings.payment_uzum_enabled;
                case "paynet": return settings.payment_paynet_enabled;
                default: return true;
            }
        });
    }, [allPaymentMethods, settings]);

    const orderTypes = useMemo(() => {
        const types: { id: "delivery" | "takeaway" | "preorder"; label: string; icon: React.ReactNode; desc: string }[] = [];

        if (settings?.delivery_enabled) {
            types.push({ id: "delivery", label: "Yetkazib berish", icon: <Truck className="h-5 w-5" />, desc: "Manzilingizga" });
        }

        types.push({ id: "takeaway", label: "O'zi bilan", icon: <ShoppingBag className="h-5 w-5" />, desc: "Olib ketish" });
        types.push({ id: "preorder", label: "Bron qilish", icon: <Clock className="h-5 w-5" />, desc: "Oldindan" });

        return types;
    }, [settings]);

    if (productsLoading || settingsLoading || !product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <Header userName={fullName} onLogout={() => { }} compact />

            <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
                {/* Back Button */}
                <button
                    className="group mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-all group-hover:bg-primary group-hover:text-white">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    Orqaga qaytish
                </button>

                <div className="grid gap-8 lg:grid-cols-12 lg:items-start">

                    {/* Left Column: Product Info & Summary */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sticky top-24 overflow-hidden rounded-3xl border bg-white shadow-xl shadow-slate-200/50"
                        >
                            {/* Product Image */}
                            <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 text-white">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
                                        Siz tanlagan mahsulot
                                    </span>
                                    <h1 className="text-3xl font-bold">{product.name}</h1>
                                </div>
                            </div>

                            {/* Order Summary Details */}
                            <div className="p-8">
                                <div className="mb-6 flex items-center justify-between border-b pb-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Donasi</p>
                                        <p className="text-xl font-bold text-foreground">{formatPrice(product.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl bg-slate-100 p-2">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold shadow-sm transition-transform active:scale-95"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center text-lg font-bold">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold shadow-sm transition-transform active:scale-95"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Mahsulot jami</span>
                                        <span>{formatPrice(totalPrice)}</span>
                                    </div>
                                    {orderType === "delivery" && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Dastavka</span>
                                            <span className="font-medium text-emerald-600">Bepul ✨</span>
                                        </div>
                                    )}
                                    <div className="mt-6 flex items-center justify-between border-t pt-6">
                                        <span className="text-lg font-bold">Umumiy summa</span>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-primary">{formatPrice(totalPrice)}</p>
                                            {isBelowMin && (
                                                <p className="mt-1 text-xs font-medium text-destructive animate-pulse">
                                                    Minimal buyurtma: {formatPrice(MIN_ORDER_AMOUNT)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 rounded-2xl bg-blue-50/50 p-6 border border-blue-100">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-900">Xavfsiz buyurtma</h4>
                                            <p className="text-xs leading-relaxed text-blue-800/70">
                                                Har bir buyurtma adminlar tomonidan tekshiriladi va real-time tracking (Telegram-bot orqali) imkoniyati mavjud.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Checkout Form */}
                    <div className="lg:col-span-7">
                        <div className="space-y-8">
                            {/* Form Section */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/40"
                            >
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Truck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Buyurtma ma'lumotlari</h2>
                                        <p className="text-sm text-muted-foreground">Yetkazib berish va bog'lanish uchun</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Personal Info */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">F.I.SH</Label>
                                            <Input
                                                id="name"
                                                placeholder="Mas: Asadbek Karimov"
                                                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-6 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Telefon raqam</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+998 90 123 45 67"
                                                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-6 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Order Type Selector */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Buyurtma turi</Label>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            {orderTypes.map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setOrderType(type.id)}
                                                    className={cn(
                                                        "group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-300",
                                                        orderType === type.id
                                                            ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/10"
                                                            : "border-slate-100 bg-white hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                                                        orderType === type.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                                    )}>
                                                        {type.icon}
                                                    </div>
                                                    <div>
                                                        <p className={cn("font-bold", orderType === type.id ? "text-primary" : "text-foreground")}>{type.label}</p>
                                                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                                                    </div>
                                                    {orderType === type.id && (
                                                        <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    {orderType === "delivery" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="address" className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Yetkazib berish manzili</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleGetLocation}
                                                    disabled={loadingLocation}
                                                    className="h-9 rounded-xl border-current text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    {loadingLocation ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MapPin className="mr-2 h-4 w-4" />
                                                    )}
                                                    Mening joylashuvim
                                                </Button>
                                            </div>
                                            <Textarea
                                                id="address"
                                                placeholder="Mas: Minor metrosi yonidagi 4-uy, 15-xonadon..."
                                                className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 p-6 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                required={orderType === "delivery"}
                                            />
                                        </motion.div>
                                    )}

                                    {/* Payment Method Selector */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">To'lov turi</Label>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                                            {paymentMethods.map((method) => (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300",
                                                        paymentMethod === method.id
                                                            ? cn("ring-2 ring-offset-2 ring-primary/20", method.color)
                                                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                                                    )}
                                                >
                                                    <div className="flex h-8 items-center justify-center">
                                                        {method.icon}
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase tracking-tight">{method.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-6">
                                        <Button
                                            type="submit"
                                            className="h-16 w-full rounded-2xl bg-primary text-lg font-black shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                            disabled={!isFormValid || isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-3">
                                                    Buyurtmani tasdiqlash
                                                    <ArrowRight className="h-5 w-5" />
                                                </span>
                                            )}
                                        </Button>
                                        <p className="mt-4 text-center text-xs text-muted-foreground italic">
                                            "Buyurtmani tasdiqlash" tugmasini bosish orqali foydalanish shartlariga rozilik bildirasiz.
                                        </p>
                                    </div>
                                </form>
                            </motion.div>

                            {/* Security Badge */}
                            <div className="flex items-center justify-center gap-4 text-muted-foreground opacity-60 grayscale transition-all hover:grayscale-0">
                                <div className="flex items-center gap-1.5 border-r pr-4">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">24/7 Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Checkout;
