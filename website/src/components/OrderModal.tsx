import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import type { MenuItem } from "@/data/menuData";
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
  paymentMethod: "click" | "paynet" | "payme" | "uzum" | "cash";
  totalPrice: number;
}

const OrderModal = ({ item, isOpen, onClose, onConfirm, prefilledName, prefilledPhone }: OrderModalProps) => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<"click" | "paynet" | "payme" | "uzum" | "cash">("cash");
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Reset or pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(prefilledName || "");
      setPhoneNumber(prefilledPhone || "");
      setQuantity(1);
      setAddress("");
      setLocation(undefined);
      setPaymentMethod("cash");
    }
  }, [isOpen, item?.id, prefilledName, prefilledPhone]);

  if (!isOpen || !item) return null;

  const totalPrice = item.price * quantity;
  const isFormValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 9 && address.trim().length >= 3;

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
      (error) => {
        setLoadingLocation(false);
        toast.error("Joylashuvni olishda xatolik");
        console.error("Geolocation error:", error);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

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
    };

    console.log('OrderModal - Sending order data:', orderData);
    onConfirm(orderData);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const paymentMethods = [
    { id: "cash", label: "Naqd", icon: <CashLogo className="h-4 w-auto" /> },
    { id: "click", label: "Click", icon: <ClickLogo className="h-4 w-auto" /> },
    { id: "payme", label: "Payme", icon: <PaymeLogo className="h-4 w-auto" /> },
    { id: "uzum", label: "Uzum Bank", icon: <UzumLogo className="h-4 w-auto" /> },
    { id: "paynet", label: "Paynet", icon: <PaynetLogo className="h-4 w-auto" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in rounded-xl bg-background p-6 shadow-cafe-lg md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Yopish"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">
            Buyurtma berish
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Product info */}
        <div className="mb-6 rounded-lg bg-secondary p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{item.name}</span>
            <span className="text-sm font-semibold text-accent flex items-center gap-1">
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Ism va familiya <span className="text-destructive">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="To'liq ismingiz"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Phone number */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Telefon raqam <span className="text-destructive">*</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Miqdor
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:bg-muted"
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 rounded-lg border border-input bg-background px-4 py-2.5 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                min="1"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:bg-muted"
              >
                +
              </button>
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Manzil <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Yetkazish manzili"
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loadingLocation}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                title="Joylashuvni olish"
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
          </div>

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
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-all duration-300 ${paymentMethod === method.id
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-input bg-background text-foreground hover:bg-secondary/50"
                    }`}
                >
                  <div className="h-5 flex items-center justify-center">
                    {method.icon}
                  </div>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total price */}
          <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
            <span className="font-medium text-foreground">Jami summa:</span>
            <span className="text-lg font-bold text-accent">
              {formatPrice(totalPrice)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tasdiqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
