import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Truck, Shield } from "lucide-react";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import MenuSection from "@/components/MenuSection";
import Footer from "@/components/Footer";
import MapSection from "@/components/MapSection";
import type { Category, MenuItem } from "@/data/menuData";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useSupabaseSettings } from "@/hooks/useSupabaseSettings";
import {
  generatePaymentUrl,
  isOnlinePayment,
  checkRateLimit,
  validateOrderAmount,
  MIN_ORDER_AMOUNT,
  type PaymentMethod,
} from "@/services/paymentService";

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from localStorage or URL
  const [telegramUserId, setTelegramUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem("telegram_user_id");
    return saved ? parseInt(saved, 10) : null;
  });
  const [prefilledName, setPrefilledName] = useState<string>(() => localStorage.getItem("full_name") || "");
  const [prefilledPhone, setPrefilledPhone] = useState<string>(() => localStorage.getItem("phone") || "");

  const { addOrder, updateOrder } = useSupabaseOrders();
  const { settings } = useSupabaseSettings();

  // Handle Telegram user data from URL params
  useEffect(() => {
    const userId = searchParams.get("telegram_user_id");
    const fullName = searchParams.get("full_name");
    const phone = searchParams.get("phone");

    if (userId) {
      const parsedId = parseInt(userId, 10);
      if (!isNaN(parsedId)) {
        setTelegramUserId(parsedId);
        localStorage.setItem("telegram_user_id", userId);
      }
    }

    if (fullName) {
      const decodedName = decodeURIComponent(fullName);
      setPrefilledName(decodedName);
      localStorage.setItem("full_name", decodedName);
    }

    if (phone) {
      const decodedPhone = decodeURIComponent(phone);
      setPrefilledPhone(decodedPhone);
      localStorage.setItem("phone", decodedPhone);
    }
  }, [searchParams]);

  // Legacy: Redirect old payment callbacks to new dedicated pages
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const orderId = searchParams.get("order_id");
    const method = searchParams.get("method");

    if (paymentStatus && orderId) {
      const params = new URLSearchParams({ order_id: orderId, ...(method ? { method } : {}) });
      if (paymentStatus === "success") {
        navigate(`/payment/success?${params.toString()}`, { replace: true });
      } else {
        navigate(`/payment/failed?${params.toString()}`, { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const handleOrder = useCallback((item: MenuItem) => {
    navigate(`/checkout/${item.id}`);
  }, [navigate]);

  // Modal handling removed - logic moved to Checkout.tsx

  const handleLogout = () => {
    localStorage.removeItem("telegram_user_id");
    localStorage.removeItem("full_name");
    localStorage.removeItem("phone");
    setTelegramUserId(null);
    setPrefilledName("");
    setPrefilledPhone("");
    toast.success("Tizimdan chiqildi");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header userName={prefilledName} onLogout={handleLogout} title={settings.cafe_name} />

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Section */}
      <MenuSection activeCategory={activeCategory} onOrder={handleOrder} />

      {/* Map Section */}
      <MapSection />

      {/* Footer */}
      <Footer />

      {/* Demo Buttons */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 md:bottom-6 md:right-6">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground shadow-cafe-lg transition-all hover:bg-secondary/90 hover:shadow-xl"
        >
          <Shield className="h-4 w-4" />
          Admin panel (demo)
        </button>
        <button
          onClick={() => navigate("/delivery")}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-cafe-lg transition-all hover:bg-primary/90 hover:shadow-xl"
        >
          <Truck className="h-4 w-4" />
          Delivery uchun kirish (demo)
        </button>
      </div>
    </div>
  );
};

export default Index;
