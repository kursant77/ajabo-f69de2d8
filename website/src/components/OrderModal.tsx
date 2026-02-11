import { useState, useEffect, useRef, useMemo } from "react";
import { X, MapPin, ShoppingBag, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/data/menuData";
import type { PaymentMethod } from "@/services/paymentService";
import { isPaymentMethodConfigured, MIN_ORDER_AMOUNT } from "@/services/paymentService";
import { toast } from "sonner";
import { CashLogo, ClickLogo, PaymeLogo, PaynetLogo, UzumLogo } from "./payment/PaymentLogos";

interface OrderModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderData: OrderData) => void;
  prefilledName?: string;
  prefilledPhone?: string;
}

export interface OrderData {
  productName: string;
  productPrice: number;
  fullName: string;
  phoneNumber: string;
  quantity: number;
  address: string;
  location?: { lat: number; lng: number };
  paymentMethod: PaymentMethod;
  totalPrice: number;
  orderType: "delivery" | "takeaway" | "preorder";
}

// Phone number validation (UZ format)
const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^\+?998\d{9}$/.test(cleaned) || /^\d{9}$/.test(cleaned);
};

const OrderModal = ({ item, isOpen, onClose, onConfirm, prefilledName, prefilledPhone }: OrderModalProps) => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "preorder">("delivery");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Only show payment methods that are configured in .env
  const allPaymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = useMemo(() => [
    { id: "cash", label: "Naqd", icon: <CashLogo className="h-5 w-auto" />, color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
    { id: "click", label: "Click", icon: <ClickLogo className="h-5 w-auto" />, color: "border-sky-400 bg-sky-50 text-sky-700" },
    { id: "payme", label: "Payme", icon: <PaymeLogo className="h-5 w-auto" />, color: "border-teal-400 bg-teal-50 text-teal-700" },
    { id: "uzum", label: "Uzum Bank", icon: <UzumLogo className="h-5 w-auto" />, color: "border-violet-400 bg-violet-50 text-violet-700" },
    { id: "paynet", label: "Paynet", icon: <PaynetLogo className="h-5 w-auto" />, color: "border-indigo-400 bg-indigo-50 text-indigo-700" },
  ], []);

  const paymentMethods = useMemo(
    () => allPaymentMethods.filter((m) => isPaymentMethodConfigured(m.id)),
    [allPaymentMethods]
  );

  // Reset or pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(prefilledName || "");
      setPhoneNumber(prefilledPhone || "");
      setQuantity(1);
      setAddress("");
      setLocation(undefined);
      setPaymentMethod("cash");
      setOrderType("delivery");
      setIsSubmitting(false);
    }
  }, [isOpen, item?.id, prefilledName, prefilledPhone]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isTelegramUser = !!prefilledName && !!prefilledPhone;
  const totalPrice = item.price * quantity;

  const isFormValid =
    (isTelegramUser || (fullName.trim().length >= 2 && isValidPhone(phoneNumber))) &&
    (orderType !== "delivery" || address.trim().length >= 3) &&
    totalPrice >= MIN_ORDER_AMOUNT;

  const isBelowMin = totalPrice < MIN_ORDER_AMOUNT;

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
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const orderData: OrderData = {
        productName: item.name,
        productPrice: item.price,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        quantity,
        address: address.trim(),
        location,
        paymentMethod,
        totalPrice,
        orderType,
      };

      onConfirm(orderData);
    } catch {
      setIsSubmitting(false);
      toast.error("Buyurtma berishda xatolik yuz berdi");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const orderTypes: { id: "delivery" | "takeaway" | "preorder"; label: string; icon: string; desc: string }[] = [
    { id: "delivery", label: "Yetkazib berish", icon: "🚚", desc: "Manzilingizga" },
    { id: "takeaway", label: "O'zi bilan", icon: "🥡", desc: "Olib ketish" },
    { id: "preorder", label: "Bron qilish", icon: "📅", desc: "Oldindan" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl",
          "max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col",
          "animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-primary/90 via-primary to-accent/80 px-6 py-5 text-white">
          <button
            onClick={() => !isSubmitting && onClose()}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            aria-label="Yopish"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Buyurtma berish</h2>
              <p className="text-sm text-white/80">
                {isTelegramUser ? `Salom, ${fullName}!` : "Ma'lumotlaringizni kiriting"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Product info */}
          <div className="mb-5 flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/50 p-4">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="h-14 w-14 rounded-lg object-cover shadow-sm"
              />
            )}
            <div className="flex-1">
              <span className="font-semibold text-foreground">{item.name}</span>
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <span className="text-sm font-bold text-primary whitespace-nowrap">
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="order-form">
            {!isTelegramUser && (
              <>
                {/* Full name */}
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-foreground">
                    Ism va familiya <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="To'liq ismingiz"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone number */}
                <div>
                  <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-foreground">
                    Telefon raqam <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className={cn(
                      "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                      phoneNumber && !isValidPhone(phoneNumber)
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-input focus:border-primary"
                    )}
                    required
                    disabled={isSubmitting}
                  />
                  {phoneNumber && !isValidPhone(phoneNumber) && (
                    <p className="mt-1 text-xs text-destructive">To'g'ri format: +998 XX XXX XX XX</p>
                  )}
                </div>
              </>
            )}

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Miqdor
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={isSubmitting || quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-input bg-background text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                >
                  −
                </button>
                <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-secondary font-semibold text-foreground">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={isSubmitting}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-input bg-background text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Order Type Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Buyurtma turi <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {orderTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setOrderType(type.id)}
                    disabled={isSubmitting}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-xs font-semibold transition-all duration-200",
                      orderType === type.id
                        ? "border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]"
                        : "border-transparent bg-secondary/50 text-foreground hover:bg-secondary hover:border-border"
                    )}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span>{type.label}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address - Only for Delivery */}
            {orderType === "delivery" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Manzil <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={loadingLocation || isSubmitting}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl border-2 bg-background px-4 py-3.5 text-sm transition-all hover:shadow-sm active:scale-[0.99]",
                    address
                      ? "border-primary bg-primary/5"
                      : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full shrink-0 transition-colors",
                      address ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {loadingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "truncate font-medium",
                      address ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {loadingLocation ? "Aniqlanmoqda..." : (address || "📍 Joylashuvni jo'natish")}
                    </span>
                  </div>
                  {address && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Olindi</span>
                    </div>
                  )}
                </button>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Tugmani bosing va joylashuvingizni yuboring
                </p>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                To'lov usuli <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    disabled={isSubmitting}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-semibold transition-all duration-200",
                      paymentMethod === method.id
                        ? `${method.color} shadow-sm scale-[1.02]`
                        : "border-transparent bg-secondary/50 text-foreground hover:bg-secondary hover:border-border"
                    )}
                  >
                    {paymentMethod === method.id && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <div className="h-6 flex items-center justify-center">
                      {method.icon}
                    </div>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Fixed bottom - Total + Actions */}
        <div className="border-t border-border/50 bg-background px-6 py-4 space-y-3">
          {/* Total price */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-secondary to-secondary/50 p-4">
            <span className="font-medium text-foreground">Jami summa:</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {isBelowMin && (
            <p className="text-[11px] text-center text-destructive font-medium animate-pulse">
              ⚠️ Minimal buyurtma summasi: {formatPrice(MIN_ORDER_AMOUNT)}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              form="order-form"
              disabled={!isFormValid || isSubmitting}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all",
                "bg-gradient-to-r from-primary to-accent text-white shadow-lg",
                "hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Tasdiqlash
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
