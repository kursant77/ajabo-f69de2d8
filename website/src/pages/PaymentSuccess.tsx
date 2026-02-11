import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Clock, ArrowLeft, Receipt, Download, X, Printer } from "lucide-react";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { getPaymentMethodLabel, generateReceipt, type PaymentMethod, type ReceiptData } from "@/services/paymentService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateOrder } = useSupabaseOrders();
    const [processed, setProcessed] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    const orderId = searchParams.get("order_id") || "";
    const method = (searchParams.get("method") || "click") as PaymentMethod;
    const amount = searchParams.get("amount");

    // Process payment confirmation (idempotent — only runs once)
    useEffect(() => {
        if (orderId && !processed) {
            setProcessed(true);
            // Update order from pending_payment → pending
            updateOrder(orderId, { status: "pending" });
        }
    }, [orderId, processed, updateOrder]);

    const handleViewReceipt = async () => {
        if (!orderId) return;
        setLoadingReceipt(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();

            if (error) throw error;

            if (data) {
                const formattedData: ReceiptData = {
                    orderId: data.id,
                    productName: data.product_name,
                    quantity: data.quantity,
                    unitPrice: (data.total_price || 0) / data.quantity,
                    totalPrice: data.total_price || 0,
                    paymentMethod: data.payment_method || method,
                    customerName: data.customer_name,
                    phoneNumber: data.phone_number,
                    orderType: data.order_type || "delivery",
                    date: new Date(data.created_at),
                };
                setReceiptData(formattedData);
                setShowReceipt(true);
            }
        } catch (err) {
            console.error("Error fetching receipt:", err);
            toast.error("Chekni yuklashda xatolik yuz berdi");
        } finally {
            setLoadingReceipt(false);
        }
    };

    const formatPrice = (price: string | number | null) => {
        if (!price) return "";
        return new Intl.NumberFormat("uz-UZ").format(Number(price)) + " so'm";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Success Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100/50">
                    {/* Green Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 rounded-full bg-white blur-3xl animate-pulse" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 rounded-full bg-white blur-3xl" />
                        </div>

                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm animate-in zoom-in duration-500 relative z-10">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1 relative z-10">
                            To'lov muvaffaqiyatli! ✅
                        </h1>
                        <p className="text-white/80 text-sm relative z-10">
                            Buyurtmaga to'lov qabul qilindi
                        </p>
                    </div>

                    {/* Details */}
                    <div className="px-8 py-6 space-y-4">
                        {/* Order ID */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Package className="h-4 w-4" />
                                <span className="text-sm">Buyurtma ID</span>
                            </div>
                            <span className="font-mono font-semibold text-gray-800 text-sm">
                                #{orderId.slice(0, 8)}
                            </span>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Receipt className="h-4 w-4" />
                                <span className="text-sm">To'lov usuli</span>
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">
                                {getPaymentMethodLabel(method)}
                            </span>
                        </div>

                        {/* Amount */}
                        {amount && (
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Summa</span>
                                <span className="font-bold text-lg text-emerald-600">
                                    {formatPrice(amount)}
                                </span>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Tayyorlanmoqda...
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Holat o'zgarganda xabar olasiz
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-8 pb-8 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleViewReceipt}
                                disabled={loadingReceipt}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loadingReceipt ? (
                                    <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Printer className="h-4 w-4" />
                                )}
                                Chekni ko'rish
                            </button>
                            <button
                                onClick={() => navigate("/my-orders")}
                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
                            >
                                <Package className="h-4 w-4" />
                                Buyurtmalarim
                            </button>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Bosh sahifaga qaytish
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Elektron chek</h3>
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-700 bg-white p-6 rounded-xl border border-dashed border-gray-300 shadow-inner">
                                {generateReceipt(receiptData)}
                            </pre>
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100">
                            <button
                                onClick={() => window.print()}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black active:scale-[0.98]"
                            >
                                <Printer className="h-4 w-4" />
                                Chop etish / Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSuccess;
