"""
Service for sending notifications to users.
"""
from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError
from utils.logger import logger
from utils.id_formatter import format_order_id


# Message templates in Uzbek with rich formatting
MESSAGE_TEMPLATES = {
    "confirmed": (
        "✨ <b>Yangi buyurtma qabul qilindi!</b>\n\n"
        "🆔 <b>Buyurtma:</b> <code>{order_id}</code>\n"
        "🍔 <b>Mahsulot:</b> {product_name}\n"
        "⏳ <b>Holat:</b> Tasdiqlandi\n\n"
        "<i>Tez orada taomingizni tayyorlashni boshlaymiz!</i>"
    ),
    "ready": (
        "🍳 <b>Buyurtmangiz tayyor bo'ldi!</b>\n\n"
        "🆔 <b>Buyurtma:</b> <code>{order_id}</code>\n"
        "🍔 <b>Mahsulot:</b> {product_name}\n"
        "🏃‍♂️ <b>Holat:</b> Dastavkaga berildi\n\n"
        "<i>Dastavkachi hozir yo'lga chiqadi.</i>"
    ),
    "delivering": (
        "🚚 <b>Buyurtmangiz yo'lda!</b>\n\n"
        "🆔 <b>Buyurtma:</b> <code>{order_id}</code>\n"
        "🍔 <b>Mahsulot:</b> {product_name}\n"
        "📍 <b>Holat:</b> Yetkazilmoqda\n\n"
        "<i>Iltimos, kuting, dastavkachi yaqin orada yetib boradi.</i>"
    ),
    "delivered": (
        "✅ <b>Tabriklaymiz! Buyurtma yetkazildi!</b>\n\n"
        "🆔 <b>Buyurtma:</b> <code>{order_id}</code>\n"
        "🍔 <b>Mahsulot:</b> {product_name}\n"
        "🏁 <b>Holat:</b> Yakunlandi\n\n"
        "<b>Yoqimli ishtaha! 🍽️</b>\n"
        "<i>Bizni tanlaganingiz uchun rahmat!</i>"
    )
}


async def notify_user_order_status(
    bot: Bot,
    telegram_user_id: int,
    order_id: str,
    status: str,
    product_name: str = "Savatcha"
) -> dict:
    """
    Send order status notification to the user.
    
    Args:
        bot: Bot instance
        telegram_user_id: User's Telegram ID
        order_id: Order ID
        status: Order status (confirmed, ready, delivering, delivered)
        
    Returns:
        dict with success status and message
    """
    if status not in MESSAGE_TEMPLATES:
        logger.error(f"Invalid status: {status}")
        return {
            "success": False,
            "message": f"Invalid status: {status}"
        }
    
    # Format order ID for display
    display_id = format_order_id(order_id)
    
    # Get message template
    message_text = MESSAGE_TEMPLATES[status].format(
        order_id=display_id,
        product_name=product_name or "Taomlar"
    )
    
    try:
        await bot.send_message(
            chat_id=telegram_user_id,
            text=message_text
        )
        
        logger.info(
            f"Notification sent to user {telegram_user_id} "
            f"for order {order_id} with status {status}"
        )
        
        return {
            "success": True,
            "message": "Notification sent successfully"
        }
        
    except TelegramForbiddenError:
        logger.warning(
            f"User {telegram_user_id} blocked the bot"
        )
        return {
            "success": False,
            "message": "User blocked the bot"
        }
        
    except TelegramBadRequest as e:
        logger.error(
            f"Bad request sending notification to {telegram_user_id}: {e}"
        )
        return {
            "success": False,
            "message": f"Bad request: {str(e)}"
        }
        
    except Exception as e:
        logger.error(
            f"Error sending notification to {telegram_user_id}: {e}"
        )
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }
