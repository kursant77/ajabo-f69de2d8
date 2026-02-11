import { Phone, MapPin, Clock, Check, Truck, ExternalLink, Banknote, CreditCard } from "lucide-react";
import type { Order } from "@/data/deliveryData";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: Order["status"]) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
  const isDelivered = order.status === "delivered";

  const getGoogleMapsUrl = (address: string) => {
    // Try to extract coordinates from string like "Lat: 41.123, Lng: 60.123"
    const coordRegex = /Lat:\s*([0-9.-]+),\s*Lng:\s*([0-9.-]+)/i;
    const match = address.match(coordRegex);
    if (match) {
      return `https://www.google.com/maps/search/?api=1&query=${match[1]},${match[2]}`;
    }
    // Fallback to text search
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "delivered":
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">✅ Yetkazildi</span>;
      case "on_way":
        return <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">🚚 Yo'lda</span>;
      case "ready":
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">🥡 Tayyor</span>;
      case "pending_payment":
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 italic">💳 To'lov kutilmoqda</span>;
      default:
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⏳ Tayyorlanmoqda</span>;
    }
  };

  const renderActionButton = () => {
    switch (order.status) {
      case "pending":
        return (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-secondary-foreground opacity-50"
          >
            <Clock className="h-4 w-4" />
            Tayyorlanmoqda...
          </button>
        );
      case "ready":
        return (
          <button
            onClick={() => onStatusUpdate(order.id, "on_way")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <Truck className="h-4 w-4" />
            Jarayonda
          </button>
        );
      case "on_way":
        return (
          <button
            onClick={() => onStatusUpdate(order.id, "delivered")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-700 active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            Yetkazib berildi
          </button>
        );
      case "delivered":
        return (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2.5 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" />
            Yetkazib berildi
          </div>
        );
      case "pending_payment":
        return (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-2.5 text-sm font-medium text-slate-400 border border-dashed border-slate-200">
            <Clock className="h-4 w-4" />
            To'lovni kutish...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-5 shadow-cafe transition-all duration-300",
        isDelivered ? "opacity-75" : "hover:shadow-cafe-lg"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground">
            {order.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              Miqdor: <span className="font-medium">{order.quantity} dona</span>
            </p>
            {order.totalPrice && order.totalPrice > 0 && (
              <span className="text-sm font-semibold text-primary">
                • {formatPrice(order.totalPrice)}
              </span>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Customer Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-card-foreground">
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <a
            href={`tel:${order.phoneNumber.replace(/\s/g, "")}`}
            className="hover:text-primary transition-colors"
          >
            {order.phoneNumber}
          </a>
        </div>
        <div className="flex items-start justify-between gap-2 text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{order.address}</span>
          </div>
          <a
            href={getGoogleMapsUrl(order.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 items-center gap-1 rounded bg-secondary px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Xarita
          </a>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Buyurtma vaqti: {order.createdAt}</span>
        </div>
        {/* Payment method indicator */}
        {order.paymentMethod && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {order.paymentMethod === "cash" ? (
              <Banknote className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            <span>
              To'lov: {
                order.paymentMethod === "cash" ? "Naqd" :
                  order.paymentMethod === "click" ? "Click" :
                    order.paymentMethod === "payme" ? "Payme" :
                      order.paymentMethod === "uzum" ? "Uzum Bank" :
                        order.paymentMethod === "paynet" ? "Paynet" :
                          order.paymentMethod
              }
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {renderActionButton()}
    </article>
  );
};

export default OrderCard;
