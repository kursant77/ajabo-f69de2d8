/**
 * Payment Service - To'lov tizimi xizmati
 *
 * Bu service barcha to'lov usullari (Click, Payme, Paynet, Uzum, Cash) uchun
 * URL generatsiya qiladi va to'lov konfiguratsiyasini .env dan oladi.
 *
 * Merchantlar .env fayliga yozilishi kerak:
 *   VITE_CLICK_SERVICE_ID, VITE_CLICK_MERCHANT_ID
 *   VITE_PAYME_MERCHANT_ID
 *   VITE_UZUM_MERCHANT_ID
 *   VITE_PAYNET_SERVICE_ID
 */

export type PaymentMethod = "click" | "payme" | "paynet" | "uzum" | "cash";

export interface PaymentConfig {
    orderId: string;
    amount: number;
    productName: string;
    phoneNumber: string;
}

const isDev = import.meta.env.DEV;

/**
 * Minimum order amount in so'm. Orders below this amount will be rejected.
 */
export const MIN_ORDER_AMOUNT = 5000;

/**
 * Rate limit: max orders per minute per user.
 */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

// =====================================================
// MERCHANT KONFIGURATSIYASI (.env dan olinadi)
// =====================================================
const MERCHANT_CONFIG = {
    click: {
        service_id: import.meta.env.VITE_CLICK_SERVICE_ID || "",
        merchant_id: import.meta.env.VITE_CLICK_MERCHANT_ID || "",
    },
    payme: {
        merchant_id: import.meta.env.VITE_PAYME_MERCHANT_ID || "",
    },
    uzum: {
        merchant_id: import.meta.env.VITE_UZUM_MERCHANT_ID || "",
    },
    paynet: {
        service_id: import.meta.env.VITE_PAYNET_SERVICE_ID || "",
    },
};

/**
 * Checks if a specific payment method is properly configured with merchant credentials.
 */
export const isPaymentMethodConfigured = (method: PaymentMethod): boolean => {
    switch (method) {
        case "click":
            return !!(MERCHANT_CONFIG.click.service_id && MERCHANT_CONFIG.click.merchant_id);
        case "payme":
            return !!MERCHANT_CONFIG.payme.merchant_id;
        case "uzum":
            return !!MERCHANT_CONFIG.uzum.merchant_id;
        case "paynet":
            return !!MERCHANT_CONFIG.paynet.service_id;
        case "cash":
            return true;
        default:
            return false;
    }
};

/**
 * Returns a list of available (configured) payment methods.
 */
export const getAvailablePaymentMethods = (): PaymentMethod[] => {
    const allMethods: PaymentMethod[] = ["cash", "click", "payme", "uzum", "paynet"];
    return allMethods.filter(isPaymentMethodConfigured);
};

/**
 * Generates the return URL for payment callbacks.
 * After payment is completed, the user will be redirected to this URL.
 */
const getReturnUrl = (orderId: string, method: PaymentMethod, amount?: number): string => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
        order_id: orderId,
        method,
        ...(amount ? { amount: amount.toString() } : {}),
    });
    return `${baseUrl}/payment/success?${params.toString()}`;
};

/**
 * Generates the failed return URL.
 */
const getFailedReturnUrl = (orderId: string, method: PaymentMethod, amount?: number): string => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
        order_id: orderId,
        method,
        ...(amount ? { amount: amount.toString() } : {}),
    });
    return `${baseUrl}/payment/failed?${params.toString()}`;
};

/**
 * Safely encodes a string to Base64, handling Unicode characters.
 */
const safeBase64Encode = (str: string): string => {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch {
        return btoa(str);
    }
};

/**
 * Detects if the current device is mobile (for Click deep link).
 */
const isMobileDevice = (): boolean => {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Generates the payment URL for the given payment method.
 * Returns null for cash payments, if config is invalid, or if merchant is not configured.
 *
 * @param method - Selected payment method
 * @param config - Payment configuration (orderId, amount, productName, phoneNumber)
 * @returns Payment URL string or null
 */
export const generatePaymentUrl = (method: PaymentMethod, config: PaymentConfig): string | null => {
    const { orderId, amount } = config;

    // Input validation
    if (!orderId || !orderId.trim()) {
        if (isDev) console.error("❌ Payment error: orderId is empty");
        return null;
    }
    if (!amount || amount <= 0 || !isFinite(amount)) {
        if (isDev) console.error("❌ Payment error: amount is invalid:", amount);
        return null;
    }

    // Check if payment method is configured
    if (!isPaymentMethodConfigured(method)) {
        if (isDev) {
            console.warn(
                `⚠️ Payment method "${method}" is not configured. Please add merchant credentials to .env file.`
            );
        }
        return null;
    }

    const isMobile = isMobileDevice();
    const returnUrl = getReturnUrl(orderId, method, amount);
    const failUrl = getFailedReturnUrl(orderId, method, amount);

    switch (method) {
        case "click": {
            const clickParams = new URLSearchParams({
                service_id: MERCHANT_CONFIG.click.service_id,
                merchant_id: MERCHANT_CONFIG.click.merchant_id,
                amount: amount.toString(),
                transaction_param: orderId,
                return_url: returnUrl,
            });

            // Click supports a deep link scheme for mobile
            return isMobile
                ? `click://pay?${clickParams.toString()}`
                : `https://my.click.uz/services/pay?${clickParams.toString()}`;
        }

        case "payme": {
            // Payme expects amount in "tiyin" (1 so'm = 100 tiyin)
            const amountInTiyn = Math.round(amount * 100);
            const paymeParams = [
                `m=${MERCHANT_CONFIG.payme.merchant_id}`,
                `ac.order_id=${orderId}`,
                `a=${amountInTiyn}`,
                `c=${returnUrl}`,
            ].join(";");
            const encodedParams = safeBase64Encode(paymeParams);

            return `https://checkout.paycom.uz/${encodedParams}`;
        }

        case "uzum": {
            const uzumParams = new URLSearchParams({
                merchant_id: MERCHANT_CONFIG.uzum.merchant_id,
                amount: amount.toString(),
                order_id: orderId,
                return_url: returnUrl,
            });

            return `https://uzumbank.uz/pay?${uzumParams.toString()}`;
        }

        case "paynet": {
            const paynetParams = new URLSearchParams({
                service_id: MERCHANT_CONFIG.paynet.service_id,
                amount: amount.toString(),
                order_id: orderId,
                return_url: returnUrl,
            });

            return `https://paynet.uz/pay?${paynetParams.toString()}`;
        }

        case "cash":
        default:
            return null;
    }
};

/**
 * Validates if the payment method requires external redirection.
 */
export const isOnlinePayment = (method: PaymentMethod): boolean => {
    return method !== "cash";
};

/**
 * Returns a human-readable label for the payment method.
 */
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
        click: "Click",
        payme: "Payme",
        paynet: "Paynet",
        uzum: "Uzum Bank",
        cash: "Naqd pul",
    };
    return labels[method] || method;
};

/**
 * Returns all payment method details (for displaying in UI).
 */
export const getAllPaymentMethods = (): {
    id: PaymentMethod;
    label: string;
    online: boolean;
    configured: boolean;
}[] => {
    const methods: PaymentMethod[] = ["cash", "click", "payme", "uzum", "paynet"];
    return methods.map((id) => ({
        id,
        label: getPaymentMethodLabel(id),
        online: isOnlinePayment(id),
        configured: isPaymentMethodConfigured(id),
    }));
};

// =====================================================
// RATE LIMITING
// =====================================================

const orderTimestamps: number[] = [];

/**
 * Checks if the user has exceeded the rate limit.
 * Returns true if allowed, false if rate limited.
 */
export const checkRateLimit = (): { allowed: boolean; retryAfterMs: number } => {
    const now = Date.now();
    // Remove old timestamps outside the window
    while (orderTimestamps.length > 0 && orderTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
        orderTimestamps.shift();
    }

    if (orderTimestamps.length >= RATE_LIMIT_MAX) {
        const oldestInWindow = orderTimestamps[0];
        const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
        return { allowed: false, retryAfterMs };
    }

    orderTimestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
};

// =====================================================
// ORDER AMOUNT VALIDATION
// =====================================================

/**
 * Validates the order amount against the minimum threshold.
 */
export const validateOrderAmount = (amount: number): { valid: boolean; minAmount: number } => {
    return {
        valid: amount >= MIN_ORDER_AMOUNT,
        minAmount: MIN_ORDER_AMOUNT,
    };
};

// =====================================================
// RECEIPT GENERATION
// =====================================================

export interface ReceiptData {
    orderId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    paymentMethod: PaymentMethod;
    customerName: string;
    phoneNumber: string;
    orderType: string;
    date: Date;
}

/**
 * Generates a text-based receipt for an order.
 */
export const generateReceipt = (data: ReceiptData): string => {
    const formatPrice = (price: number) =>
        new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

    const dateStr = data.date.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const timeStr = data.date.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return [
        "═══════════════════════════",
        "        🍔 AJABO BURGER",
        "           CHEK",
        "═══════════════════════════",
        "",
        `📅 ${dateStr}   🕐 ${timeStr}`,
        `📋 Buyurtma: #${data.orderId.slice(0, 8)}`,
        "",
        "───────────────────────────",
        `🍔 ${data.productName}`,
        `   ${data.quantity} x ${formatPrice(data.unitPrice)}`,
        "───────────────────────────",
        `💰 JAMI: ${formatPrice(data.totalPrice)}`,
        "───────────────────────────",
        "",
        `👤 ${data.customerName}`,
        `📞 ${data.phoneNumber}`,
        `💳 ${getPaymentMethodLabel(data.paymentMethod)}`,
        `📦 ${data.orderType === "delivery" ? "Yetkazib berish" : data.orderType === "takeaway" ? "Olib ketish" : "Bron"}`,
        "",
        "═══════════════════════════",
        "    Xaridingiz uchun rahmat!",
        "═══════════════════════════",
    ].join("\n");
};
