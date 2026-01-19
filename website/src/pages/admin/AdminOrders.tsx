import { useState, useMemo, useCallback } from "react";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { toast } from "sonner";
import { Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOrderCard from "@/components/admin/AdminOrderCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type AdminOrder } from "@/data/adminData";

const AdminOrders = () => {
  const { orders, updateOrder, loading } = useSupabaseOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "processing" | "delivered">("pending");

  // Memoize handlers to prevent re-creating functions on every render
  const handleStatusChange = useCallback((orderId: string, status: "pending" | "ready" | "on_way" | "delivered") => {
    updateOrder(orderId, { status });
    toast.success(
      status === "delivered"
        ? "Buyurtma yetkazildi deb belgilandi"
        : status === "ready"
          ? "Buyurtma tayyor deb belgilandi"
          : "Buyurtma holati o'zgartirildi"
    );
  }, [updateOrder]);

  const handleAssignDelivery = useCallback((orderId: string) => {
    updateOrder(orderId, { deliveryPerson: "Sardor Yusupov" });
    toast.success("Dastavkachi tayinlandi");
  }, [updateOrder]);

  // Memoize filtered orders and counts - only recalculate when dependencies change
  const { filteredOrders, pendingCount, processingCount, deliveredCount } = useMemo(() => {
    // Exclude unpaid orders from all admin views
    const paidOrders = (orders as AdminOrder[]).filter(o => o.status !== "pending_payment");

    const filtered = paidOrders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phoneNumber.includes(searchQuery);

      let matchesStatus = false;
      if (statusFilter === "pending") {
        matchesStatus = order.status === "pending";
      } else if (statusFilter === "processing") {
        matchesStatus = order.status === "ready" || order.status === "on_way";
      } else if (statusFilter === "delivered") {
        matchesStatus = order.status === "delivered";
      }

      return matchesSearch && matchesStatus;
    });

    const pending = paidOrders.filter((o) => o.status === "pending").length;
    const processing = paidOrders.filter((o) => o.status === "ready" || o.status === "on_way").length;
    const delivered = paidOrders.filter((o) => o.status === "delivered").length;

    return {
      filteredOrders: filtered,
      pendingCount: pending,
      processingCount: processing,
      deliveredCount: delivered
    };
  }, [orders, searchQuery, statusFilter]);

  if (loading) {
    return (
      <AdminLayout title="Buyurtmalar">
        <div className="flex justify-center items-center h-48">
          <p>Yuklanmoqda...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Buyurtmalar">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
          >
            Kutilmoqda ({pendingCount})
          </Button>
          <Button
            variant={statusFilter === "processing" ? "default" : "outline"}
            onClick={() => setStatusFilter("processing")}
          >
            Jarayonda ({processingCount})
          </Button>
          <Button
            variant={statusFilter === "delivered" ? "default" : "outline"}
            onClick={() => setStatusFilter("delivered")}
          >
            Yetkazildi ({deliveredCount})
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <AdminOrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
            onAssignDelivery={handleAssignDelivery}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Buyurtmalar topilmadi</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
