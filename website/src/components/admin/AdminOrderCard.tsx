import { memo } from "react";
import { Phone, MapPin, Clock, User, Truck, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminOrder } from "@/data/adminData";
import { getPaymentMethodLabel } from "@/services/paymentService";

interface AdminOrderCardProps {
  order: AdminOrder;
  onStatusChange: (orderId: string, status: "pending" | "ready" | "on_way" | "delivered") => void;
  onAssignDelivery?: (orderId: string) => void;
}

const AdminOrderCard = ({
  order,
  onStatusChange,
  onAssignDelivery,
}: AdminOrderCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price || 0) + " so'm";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✅ Yetkazildi</Badge>;
      case "ready":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">🥡 Tayyor</Badge>;
      case "on_way":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">🚚 Jarayonda</Badge>;
      case "pending_payment":
        return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 italic">💳 To'lov kutilmoqda</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">⏳ Kutilmoqda</Badge>;
    }
  };

  const getOrderTypeBadge = (type?: string) => {
    switch (type) {
      case "takeaway":
        return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50/50">🥡 O'zi bilan</Badge>;
      case "preorder":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50">📅 Bron qilish</Badge>;
      default:
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50/50">🚚 Dastavka</Badge>;
    }
  };

  const getPaymentBadge = () => {
    if (!order.paymentMethod) return null;
    const isCash = order.paymentMethod === "cash";
    const Icon = isCash ? Banknote : CreditCard;
    return (
      <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50/50 gap-1">
        <Icon className="h-3 w-3" />
        {getPaymentMethodLabel(order.paymentMethod)}
      </Badge>
    );
  };

  const isPendingPayment = order.status === "pending_payment";

  return (
    <div className={`bg-card rounded-xl border border-border/50 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${isPendingPayment ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg text-foreground">
              {order.productName}
            </h3>
            {getOrderTypeBadge(order.orderType)}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {order.quantity} dona • {formatPrice(order.totalPrice)}
            </p>
            {getPaymentBadge()}
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{order.phoneNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{order.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{order.createdAt}</span>
        </div>
        {order.deliveryPerson && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Truck className="h-4 w-4" />
            <span>{order.deliveryPerson}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isPendingPayment && (
          <div className="w-full text-center py-2.5 rounded-lg bg-slate-50 text-sm font-medium text-slate-400 border border-dashed border-slate-200">
            💳 To'lov kutilmoqda...
          </div>
        )}

        {order.status === "pending" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onStatusChange(order.id, "ready")}
            className="w-full"
          >
            Buyurtma tayyor
          </Button>
        )}

        {order.status === "ready" && (
          <div className="flex flex-col gap-2 w-full">
            {order.orderType === "delivery" ? (
              !order.deliveryPerson && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAssignDelivery?.(order.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Dastavkachi tayinlash
                </Button>
              )
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onStatusChange(order.id, "delivered")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {order.orderType === "takeaway" ? "Olib ketildi" : "Mijoz keldi"}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(order.id, "pending")}
              className="w-full"
            >
              Qayta ochish
            </Button>
          </div>
        )}

        {order.status === "on_way" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onStatusChange(order.id, "delivered")}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Yetkazildi
          </Button>
        )}

        {order.status === "delivered" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(order.id, "pending")}
            className="w-full"
          >
            Qayta ochish
          </Button>
        )}
      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default memo(AdminOrderCard);
