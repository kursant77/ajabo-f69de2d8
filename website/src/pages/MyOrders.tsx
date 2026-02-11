import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Package, Clock, Truck, Check, CreditCard,
    Banknote, RefreshCw, ShoppingBag, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { generatePaymentUrl, getPaymentMethodLabel, type PaymentMethod } from "@/services/paymentService";
import type { Order } from "@/data/deliveryData";

const MyOrders = () => {
    const navigate = useNavigate();
    const { orders, loading } = useSupabaseOrders();
    const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>("");

    // Load user identity from localStorage
    useEffect(() => {
        const savedId = localStorage.getItem("telegram_user_id");
        const savedPhone = localStorage.getItem("phone");
        if (savedId) setTelegramUserId(parseInt(savedId, 10));
        if (savedPhone) setPhoneNumber(savedPhone);
    }, []);

    // Filter orders for this user (by telegram ID or phone)
    const myOrders = useMemo(() => {
        if (!telegramUserId && !phoneNumber) return [];
        return orders.filter((o) => {
            if (telegramUserId && o.telegramUserId === telegramUserId) return true;
            if (phoneNumber && o.phoneNumber === phoneNumber) return true;
            return false;
        });
    }, [orders, telegramUserId, phoneNumber]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

    const getStatusConfig = (status: Order["status"]) => {
        switch (status) {
            case "pending_payment":
                return {
                    label: "To'lov kutilmoqda",
                    icon: CreditCard,
                    color: "bg-slate-100 text-slate-600",
                    dot: "bg-slate-400",
                };
            case "pending":
                return {
                    label: "Tayyorlanmoqda",
                    icon: Clock,
                    color: "bg-amber-100 text-amber-700",
                    dot: "bg-amber-400 animate-pulse",
                };
            case "ready":
                return {
                    label: "Tayyor",
                    icon: Package,
                    color: "bg-blue-100 text-blue-700",
                    dot: "bg-blue-400",
                };
            case "on_way":
                return {
                    label: "Yo'lda",
                    icon: Truck,
                    color: "bg-purple-100 text-purple-700",
                    dot: "bg-purple-400 animate-pulse",
                };
            case "delivered":
                return {
                    label: "Yetkazildi",
                    icon: Check,
                    color: "bg-green-100 text-green-700",
                    dot: "bg-green-400",
                };
            default:
                return {
                    label: status,
                    icon: Clock,
                    color: "bg-gray-100 text-gray-600",
                    dot: "bg-gray-400",
                };
        }
    };

    const handleRetryPayment = (order: Order) => {
        if (!order.paymentMethod || order.paymentMethod === "cash") return;
        const paymentUrl = generatePaymentUrl(order.paymentMethod, {
            orderId: order.id,
            amount: order.totalPrice || 0,
            productName: order.productName,
            phoneNumber: order.phoneNumber,
        });
        if (paymentUrl) {
            window.location.href = paymentUrl;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasIdentity = telegramUserId || phoneNumber;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="mx-auto max-w-lg px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-all hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Buyurtmalarim</h1>
                        <p className="text-xs text-muted-foreground">
                            {myOrders.length > 0 ? `${myOrders.length} ta buyurtma` : "Real vaqtda yangilanadi"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-lg px-4 py-6">
                {!hasIdentity ? (
                    /* Not logged in */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            Tizimga kiring
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                            Buyurtmalaringizni ko'rish uchun Telegram bot orqali yoki bosh sahifada buyurtma bering
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                        >
                            Bosh sahifaga
                        </button>
                    </div>
                ) : myOrders.length === 0 ? (
                    /* No orders */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                            <Package className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            Buyurtmalar yo'q
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Siz hali buyurtma bermadingiz
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                        >
                            Buyurtma berish
                        </button>
                    </div>
                ) : (
                    /* Orders list */
                    <div className="space-y-3">
                        {myOrders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;
                            const isPendingPayment = order.status === "pending_payment";

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        "rounded-2xl border bg-card p-5 shadow-sm transition-all",
                                        isPendingPayment ? "border-dashed border-slate-300 opacity-80" : "border-border/50"
                                    )}
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-foreground">{order.productName}</h3>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {order.quantity} dona • {formatPrice(order.totalPrice || 0)}
                                            </p>
                                        </div>
                                        <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", statusConfig.color)}>
                                            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    {/* Status timeline */}
                                    <div className="flex items-center gap-1 mb-3">
                                        {["pending", "ready", "on_way", "delivered"].map((step, i) => {
                                            const steps = ["pending", "ready", "on_way", "delivered"];
                                            const currentIdx = steps.indexOf(order.status);
                                            const isActive = i <= currentIdx && order.status !== "pending_payment";
                                            return (
                                                <div key={step} className="flex items-center flex-1">
                                                    <div className={cn(
                                                        "h-1.5 w-full rounded-full transition-all",
                                                        isActive ? "bg-primary" : "bg-secondary"
                                                    )} />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {order.createdAt}
                                            </span>
                                            {order.paymentMethod && (
                                                <span className="flex items-center gap-1">
                                                    {order.paymentMethod === "cash" ? (
                                                        <Banknote className="h-3 w-3" />
                                                    ) : (
                                                        <CreditCard className="h-3 w-3" />
                                                    )}
                                                    {getPaymentMethodLabel(order.paymentMethod)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-mono text-[10px]">#{order.id.slice(0, 8)}</span>
                                    </div>

                                    {/* Retry button for pending_payment */}
                                    {isPendingPayment && order.paymentMethod && order.paymentMethod !== "cash" && (
                                        <button
                                            onClick={() => handleRetryPayment(order)}
                                            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Qayta to'lash
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
