/**
 * Service for handling payment redirections and checkout URL generation.
 */

export type PaymentMethod = "click" | "payme" | "paynet" | "uzum" | "cash";

interface PaymentConfig {
    orderId: string;
    amount: number;
    productName: string;
    phoneNumber: string;
}

export const generatePaymentUrl = (method: PaymentMethod, config: PaymentConfig): string | null => {
    const { orderId, amount, productName, phoneNumber } = config;

    // ℹ️ IMPORTANT: O'zingizning Merchant ma'lumotlaringizni bu yerga yozing.
    // Bu ID'larni Click/Payme bilan shartnoma imzolagandan so'ng olasiz.
    const MERCHANT_CONFIG = {
        click: {
            service_id: "12345", // O'zingizning Service ID 
            merchant_id: "67890"  // O'zingizning Merchant ID
        },
        payme: {
            merchant_id: "67890abcdef..." // O'zingizning Merchant ID
        },
        uzum: {
            merchant_id: "112233" // O'zingizning Merchant ID
        },
        paynet: {
            service_id: "556677" // O'zingizning Service ID
        },
    };

    switch (method) {
        case "click":
            // Standard Click.uz URL format
            return `https://my.click.uz/services/pay?service_id=${MERCHANT_CONFIG.click.service_id}&merchant_id=${MERCHANT_CONFIG.click.merchant_id}&amount=${amount}&transaction_param=${orderId}`;

        case "payme":
            // Standard Payme.uz URL format (base64 encoded params)
            const paymeParams = btoa(`m=${MERCHANT_CONFIG.payme.merchant_id};ac.order_id=${orderId};a=${amount * 100}`);
            return `https://checkout.paycom.uz/${paymeParams}`;

        case "uzum":
            // Uzum Bank checkout (simulated)
            return `https://uzumbank.uz/pay?merchant_id=${MERCHANT_CONFIG.uzum.merchant_id}&amount=${amount}&order_id=${orderId}`;

        case "paynet":
            // Paynet checkout (simulated)
            return `https://paynet.uz/pay?service_id=${MERCHANT_CONFIG.paynet.service_id}&amount=${amount}&order_id=${orderId}`;

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
