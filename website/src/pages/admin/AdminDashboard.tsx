import { useMemo } from "react";
import { ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";

const AdminDashboard = () => {
  const { orders, loading } = useSupabaseOrders();

  // Helper to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Memoize all calculations - only recalculate when orders change
  const { todayStats, graphData, topProductsList } = useMemo(() => {
    // Exclude unpaid orders from all statistics
    const paidOrders = orders.filter(o => o.status !== "pending_payment");

    // Calculate Today's Stats
    const todayOrders = paidOrders.filter((o) => isToday(o.rawCreatedAt));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const deliveredToday = todayOrders.filter((o) => o.status === "delivered").length;
    const pendingToday = todayOrders.filter((o) => o.status === "pending").length;

    // Calculate Weekly Graph Data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const weeklyData = last7Days.map((date) => {
      const dayOrders = paidOrders.filter(
        (o) =>
          o.rawCreatedAt.getDate() === date.getDate() &&
          o.rawCreatedAt.getMonth() === date.getMonth() &&
          o.rawCreatedAt.getFullYear() === date.getFullYear()
      );
      return {
        name: date.toLocaleDateString("uz-UZ", { weekday: "short" }),
        revenue: dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      };
    });

    // Calculate Top Products
    const productSales: Record<string, { quantity: number; revenue: number }> = {};
    paidOrders.forEach((o) => {
      if (!productSales[o.productName]) {
        productSales[o.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[o.productName].quantity += o.quantity;
      productSales[o.productName].revenue += o.totalPrice || 0;
    });

    const topProducts = Object.entries(productSales)
      .map(([name, stats]) => ({
        name,
        sold: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return {
      todayStats: {
        ordersCount: todayOrders.length,
        revenue: todayRevenue,
        delivered: deliveredToday,
        pending: pendingToday,
      },
      graphData: weeklyData,
      topProductsList: topProducts,
    };
  }, [orders]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  if (loading) {
    return (
      <AdminLayout title="Bosh sahifa">
        <div className="flex justify-center items-center h-48">
          <p>Yuklanmoqda...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bosh sahifa">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Bugungi buyurtmalar"
          value={todayStats.ordersCount}
          icon={ShoppingBag}
          change="Real vaqtda"
          changeType="neutral"
        />
        <StatsCard
          title="Bugungi daromad"
          value={`${formatPrice(todayStats.revenue)} so'm`}
          icon={DollarSign}
          change="Real vaqtda"
          changeType="positive"
        />
        <StatsCard
          title="Yetkazildi"
          value={todayStats.delivered}
          icon={TrendingUp}
          change={`${todayStats.pending} kutilmoqda`}
          changeType="neutral"
        />
        <StatsCard
          title="Kutilmoqda"
          value={todayStats.pending}
          icon={Clock}
          change="Hozirgi"
          changeType="neutral"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Haftalik savdo grafigi
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs text-muted-foreground" />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Eng ko'p sotilgan mahsulotlar
        </h3>
        <div className="space-y-4">
          {topProductsList.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sold} dona sotildi
                  </p>
                </div>
              </div>
              <p className="font-semibold text-primary">
                {formatPrice(product.revenue)} so'm
              </p>
            </div>
          ))}
          {topProductsList.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Hozircha ma'lumot yo'q
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
