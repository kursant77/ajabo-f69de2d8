import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Truck, Shield } from "lucide-react";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import MenuSection from "@/components/MenuSection";
import OrderModal, { type OrderData } from "@/components/OrderModal";
import Footer from "@/components/Footer";
import MapSection from "@/components/MapSection";
import type { Category, MenuItem } from "@/data/menuData";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { generatePaymentUrl, isOnlinePayment } from "@/services/paymentService";

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("kofe");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
  const [prefilledName, setPrefilledName] = useState<string>("");
  const [prefilledPhone, setPrefilledPhone] = useState<string>("");

  useEffect(() => {
    const userId = searchParams.get("telegram_user_id");
    const fullName = searchParams.get("full_name");
    const phone = searchParams.get("phone");

    if (userId) {
      const parsedId = parseInt(userId, 10);
      if (!isNaN(parsedId)) {
        setTelegramUserId(parsedId);
        console.log("Found Telegram User ID:", parsedId);
      }
    }

    if (fullName) {
      setPrefilledName(decodeURIComponent(fullName));
    }
    if (phone) {
      setPrefilledPhone(decodeURIComponent(phone));
    }
  }, [searchParams]);

  const handleOrder = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const { addOrder } = useSupabaseOrders();

  const handleConfirmOrder = async (orderData: OrderData) => {
    // Close modal
    setIsModalOpen(false);
    setSelectedItem(null);

    const isOnline = isOnlinePayment(orderData.paymentMethod as any);
    const initialStatus = isOnline ? "pending_payment" : "pending";

    // Add order to database
    const orderId = await addOrder({
      productName: orderData.productName,
      quantity: orderData.quantity,
      customerName: orderData.fullName,
      phoneNumber: orderData.phoneNumber,
      address: orderData.address || "Manzil ko'rsatilmagan",
      status: initialStatus as any,
      createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      totalPrice: orderData.totalPrice,
      telegramUserId: telegramUserId,
    } as any);

    // Filter out undefined if addOrder returns void
    const finalOrderId = orderId || "NEW";

    if (isOnline) {
      toast.info("To'lov kutilmoqda...", {
        description: "To'lov amalga oshirilgandan so'ng buyurtmangiz tasdiqlanadi.",
        duration: 4000,
      });
    } else {
      // Show success toast for cash
      toast.success("Buyurtmangiz qabul qilindi!", {
        description: `${orderData.productName} x${orderData.quantity} - ${new Intl.NumberFormat("uz-UZ").format(orderData.totalPrice)} so'm`,
        duration: 4000,
      });
    }

    // Handle online payment redirection
    if (isOnline) {
      const paymentUrl = generatePaymentUrl(orderData.paymentMethod as any, {
        orderId: finalOrderId.toString(),
        amount: orderData.totalPrice,
        productName: orderData.productName,
        phoneNumber: orderData.phoneNumber
      });

      if (paymentUrl) {
        toast.info("To'lov sahifasiga yo'naltirilmoqda...", { duration: 2000 });

        setTimeout(() => {
          // PRODUCTION READY: Real redirection enabled!
          window.location.href = paymentUrl;

          console.log(`Redirection to: ${paymentUrl}`);
        }, 1500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Section */}
      <MenuSection activeCategory={activeCategory} onOrder={handleOrder} />

      {/* Order Modal */}
      <OrderModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmOrder}
        prefilledName={prefilledName}
        prefilledPhone={prefilledPhone}
      />

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
