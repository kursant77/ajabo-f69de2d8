import { useMemo } from "react";
import { ShoppingBag, DollarSign, TrendingUp, Clock, CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  const { todayStats, graphData, topProductsList, paymentStats } = useMemo(() => {
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

    // Payment Statistics
    const methodCounts: Record<string, { count: number; revenue: number }> = {};
    let onlineCount = 0;
    let cashCount = 0;
    let pendingPaymentCount = 0;

    orders.forEach((o) => {
      if (o.status === "pending_payment") {
        pendingPaymentCount++;
        return;
      }
      const method = o.paymentMethod || "cash";
      if (!methodCounts[method]) methodCounts[method] = { count: 0, revenue: 0 };
      methodCounts[method].count++;
      methodCounts[method].revenue += o.totalPrice || 0;
      if (method === "cash") cashCount++; else onlineCount++;
    });

    const totalPaidOrders = onlineCount + cashCount;
    const onlinePercent = totalPaidOrders > 0 ? Math.round((onlineCount / totalPaidOrders) * 100) : 0;

    // Payment conversion: pending_payment that became paid
    const allPendingPayment = orders.filter((o) => o.status === "pending_payment").length;
    const totalOnlineAttempts = onlineCount + allPendingPayment;
    const conversionRate = totalOnlineAttempts > 0 ? Math.round((onlineCount / totalOnlineAttempts) * 100) : 0;

    const methodLabels: Record<string, { label: string; color: string }> = {
      cash: { label: "Naqd pul", color: "bg-emerald-500" },
      click: { label: "Click", color: "bg-sky-500" },
      payme: { label: "Payme", color: "bg-teal-500" },
      uzum: { label: "Uzum Bank", color: "bg-violet-500" },
      paynet: { label: "Paynet", color: "bg-indigo-500" },
    };

    const methodBreakdown = Object.entries(methodCounts)
      .map(([method, stats]) => ({
        method,
        label: methodLabels[method]?.label || method,
        color: methodLabels[method]?.color || "bg-gray-400",
        count: stats.count,
        revenue: stats.revenue,
        percent: totalPaidOrders > 0 ? Math.round((stats.count / totalPaidOrders) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      todayStats: {
        ordersCount: todayOrders.length,
        revenue: todayRevenue,
        delivered: deliveredToday,
        pending: pendingToday,
      },
      graphData: weeklyData,
      topProductsList: topProducts,
      paymentStats: {
        onlinePercent,
        cashCount,
        onlineCount,
        pendingPaymentCount,
        conversionRate,
        methodBreakdown,
      },
    };
  }, [orders]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <>
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


      {/* Payment Statistics */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            💳 To'lov statistikasi
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Konversiya: {paymentStats.conversionRate}%
            </span>
            {paymentStats.pendingPaymentCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {paymentStats.pendingPaymentCount} to'lov kutilmoqda
              </span>
            )}
          </div>
        </div>

        {/* Online vs Cash ratio */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Online: {paymentStats.onlineCount}</span>
            <span className="text-muted-foreground">Naqd: {paymentStats.cashCount}</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 rounded-l-full"
              style={{ width: `${paymentStats.onlinePercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500 rounded-r-full"
              style={{ width: `${100 - paymentStats.onlinePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Online {paymentStats.onlinePercent}% • Naqd {100 - paymentStats.onlinePercent}%
          </p>
        </div>

        {/* Per-method breakdown */}
        <div className="space-y-3">
          {paymentStats.methodBreakdown.map((m) => (
            <div key={m.method} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${m.color} shrink-0`} />
              <span className="text-sm font-medium text-foreground w-24">{m.label}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.color} transition-all duration-500`}
                  style={{ width: `${m.percent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">
                {m.count} ({m.percent}%)
              </span>
              <span className="text-xs font-medium text-foreground w-28 text-right">
                {formatPrice(m.revenue)} so'm
              </span>
            </div>
          ))}
          {paymentStats.methodBreakdown.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              To'lov ma'lumotlari yo'q
            </p>
          )}
        </div>
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
    </>
  );
};

export default AdminDashboard;
