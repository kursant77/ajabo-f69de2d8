"""
Inline keyboard layouts.
"""
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from bot import WEBSITE_URL


def get_webapp_keyboard(telegram_user_id: int, full_name: str = None, phone: str = None) -> InlineKeyboardMarkup:
    """
    Create an inline keyboard with Web App button.
    
    Args:
        telegram_user_id: User's Telegram ID
        full_name: User's full name from profile
        phone: User's phone number from profile
        
    Returns:
        InlineKeyboardMarkup with Web App button
    """
    import urllib.parse
    
    # Base URL with telegram_user_id
    webapp_url = f"{WEBSITE_URL}?telegram_user_id={telegram_user_id}"
    
    # Add optional parameters
    if full_name:
        webapp_url += f"&full_name={urllib.parse.quote(full_name)}"
    if phone:
        webapp_url += f"&phone={urllib.parse.quote(phone)}"
    
    # Telegram Web Apps REQUIRE HTTPS.
    if webapp_url.startswith("https:"):
        button = InlineKeyboardButton(
            text="🍔 Buyurtma berish",
            web_app=WebAppInfo(url=webapp_url)
        )
    else:
        # Fallback to browser link for HTTP (localhost)
        button = InlineKeyboardButton(
            text="🍔 Buyurtma berish (Browserda)",
            url=webapp_url
        )

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[button]]
    )
    
    return keyboard
