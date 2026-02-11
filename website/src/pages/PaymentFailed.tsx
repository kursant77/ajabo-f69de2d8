import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";
import { generatePaymentUrl, type PaymentMethod } from "@/services/paymentService";

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderId = searchParams.get("order_id") || "";
    const method = (searchParams.get("method") || "click") as PaymentMethod;
    const amount = searchParams.get("amount");

    const handleRetryPayment = () => {
        if (!orderId || !amount) {
            navigate("/");
            return;
        }

        const paymentUrl = generatePaymentUrl(method, {
            orderId,
            amount: Number(amount),
            productName: "",
            phoneNumber: "",
        });

        if (paymentUrl) {
            window.location.href = paymentUrl;
        } else {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Failed Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Red Header */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-500 px-8 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm animate-in zoom-in duration-500">
                            <XCircle className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            To'lov amalga oshmadi ❌
                        </h1>
                        <p className="text-white/80 text-sm">
                            To'lovda xatolik yuz berdi
                        </p>
                    </div>

                    {/* Details */}
                    <div className="px-8 py-6 space-y-4">
                        {/* Warning */}
                        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Pullar yechilmagan
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    Agar pullar hisobingizdan yechilgan bo'lsa, 24 soat ichida avtomatik qaytariladi. Muammo davom etsa, +998 XX XXX XX XX ga qo'ng'iroq qiling.
                                </p>
                            </div>
                        </div>

                        {/* Possible reasons */}
                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Mumkin sabablar:</p>
                            <ul className="space-y-1.5 text-xs text-gray-500">
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                                    Kartada yetarli mablag' yo'q
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                                    Internet uzilishi
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                                    To'lov vaqti tugagan (timeout)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                                    To'lov bekor qilingan
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-8 pb-8 space-y-3">
                        <button
                            onClick={handleRetryPayment}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Qayta to'lash
                        </button>
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
        </div>
    );
};

export default PaymentFailed;
