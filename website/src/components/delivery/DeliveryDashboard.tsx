import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, LogOut, Truck, Package, CheckCircle, Bell, BellOff } from "lucide-react";
import { type Order } from "@/data/deliveryData";
import OrderCard from "./OrderCard";
import { toast } from "sonner";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";

// Notification sound URL (pleasant chime)
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { orders, updateOrder, addOrder, loading } = useSupabaseOrders();
  const [displayName, setDisplayName] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed - user hasn't interacted with page yet
        console.log("Audio play blocked - user interaction required");
      });
    }
  }, [soundEnabled]);

  // Check authentication on mount
  useEffect(() => {
    const authData = localStorage.getItem("deliveryAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.isLoggedIn) {
        setDisplayName(parsed.displayName);
        return;
      }
    }
    // Redirect if not logged in
    navigate("/delivery");
  }, [navigate]);

  // Logic to detect NEW external orders should be handled by comparisons of 'orders' length or IDs.
  // For now, since useSupabaseOrders is real-time, we can rely on it.
  // We can add a simple effect to play sound when orders length increases.
  const prevOrdersLength = useRef(0);
  useEffect(() => {
    if (prevOrdersLength.current < orders.length && prevOrdersLength.current !== 0) {
      playNotificationSound();
      toast.success("Yangi buyurtma keldi!");
    }
    prevOrdersLength.current = orders.length;
  }, [orders, playNotificationSound]);

  const handleLogout = () => {
    localStorage.removeItem("deliveryAuth");
    toast.success("Tizimdan chiqdingiz");
    navigate("/delivery");
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    updateOrder(orderId, { status: newStatus });

    if (newStatus === "delivered") {
      toast.success("Buyurtma yetkazildi deb belgilandi");
    } else if (newStatus === "on_way") {
      toast.success("Buyurtma yo'lga chiqdi");
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
    toast.info(soundEnabled ? "Ovoz o'chirildi" : "Ovoz yoqildi");
  };

  // Stats (Exclude unpaid orders)
  const paidOrders = orders.filter((o) => o.status !== "pending_payment");
  const pendingCount = paidOrders.filter((o) => o.status === "pending").length;
  const deliveredCount = paidOrders.filter((o) => o.status === "delivered").length;

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const filteredOrders = paidOrders.filter((order) =>
    activeTab === "active" ? order.status !== "delivered" : order.status === "delivered"
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <Coffee className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">
                Ajabo Dastavka
              </h1>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${soundEnabled
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
                }`}
              title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            >
              {soundEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-cafe">
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {paidOrders.length}
              </p>
              <p className="text-sm text-muted-foreground">Jami buyurtmalar</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-cafe">
            <div className="rounded-full bg-amber-100 p-3">
              <Truck className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {pendingCount}
              </p>
              <p className="text-sm text-muted-foreground">Kutilmoqda</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-cafe">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {deliveredCount}
              </p>
              <p className="text-sm text-muted-foreground">Yetkazildi</p>
            </div>
          </div>
        </div>

        {/* Filters & Title */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Buyurtmalar ro'yxati
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "active"
                ? "Bajarilayotgan buyurtmalar"
                : "Yetkazib berilgan buyurtmalar tarixi"}
            </p>
          </div>
          <div className="flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Faol
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Tarix
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={index === 0 && order.id.startsWith("new-") ? "animate-fade-in" : ""}
            >
              <OrderCard
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">
              Hozircha buyurtmalar yo'q
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard;
