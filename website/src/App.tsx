import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DeliveryLoginPage from "./pages/DeliveryLogin";
import DeliveryDashboardPage from "./pages/DeliveryDashboard";
import AdminLoginPage from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminStats from "./pages/admin/AdminStats";
import AdminDelivery from "./pages/admin/AdminDelivery";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminReports from "./pages/admin/AdminReports";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminLayout from "@/components/admin/AdminLayout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import MyOrders from "./pages/MyOrders";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/checkout/:productId" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/delivery" element={<DeliveryLoginPage />} />
          <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/menu" element={<AdminMenu />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/delivery" element={<AdminDelivery />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserProfile />} />
            <Route path="/admin/staff/:role" element={<AdminStaff />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/expenses" element={<AdminExpenses />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
