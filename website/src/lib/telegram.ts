/**
 * Utility for sending notifications to the Telegram bot.
 */

const WEBHOOK_URL = import.meta.env.VITE_TELEGRAM_BOT_WEBHOOK_URL;
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY;

export type OrderStatus = "confirmed" | "ready" | "delivering" | "delivered";

interface NotificationPayload {
    order_id: string;
    telegram_user_id: number;
    status: OrderStatus;
}

/**
 * Sends an order status update to the Telegram bot.
 * 
 * @param payload - The notification payload
 * @returns Promise resolving to the response
 */
export async function notifyTelegramBot(payload: NotificationPayload) {
    if (!WEBHOOK_URL || !API_SECRET_KEY) {
        console.warn("Telegram bot webhook URL or API secret key not configured.");
        return null;
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": API_SECRET_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to notify Telegram bot:", errorData.detail || response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error notifying Telegram bot:", error);
        return null;
    }
}
