"""
Reply keyboard layouts.
"""
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo


def get_main_menu_keyboard(web_app_url: str = None) -> ReplyKeyboardMarkup:
    """
    Create the main menu keyboard with the order button.
    
    Args:
        web_app_url: The URL for the Telegram Web App
        
    Returns:
        ReplyKeyboardMarkup with main menu buttons
    """
    buttons = []
    if web_app_url:
        # We try to use WebAppInfo if it's HTTPS. 
        # For HTTP/localhost, it might fail in some Telegram clients, 
        # so we keep the text handler as a fallback.
        if web_app_url.startswith("https:"):
            buttons.append([KeyboardButton(text="🍔 Buyurtma berish", web_app=WebAppInfo(url=web_app_url))])
        else:
            # For localhost/HTTP, we still try to send it as a WebApp button, 
            # but the user can also click the text message that will be sent by the handler.
            buttons.append([KeyboardButton(text="🍔 Buyurtma berish")])
    else:
        buttons.append([KeyboardButton(text="🍔 Buyurtma berish")])
        
    # Add secondary buttons
    buttons.append([
        KeyboardButton(text="📝 Mening buyurtmalarim"),
        KeyboardButton(text="📞 Bog'lanish")
    ])
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=buttons,
        resize_keyboard=True,
        one_time_keyboard=False,
        input_field_placeholder="Buyurtma berish uchun tugmani bosing"
    )
    
    return keyboard


def get_contact_keyboard() -> ReplyKeyboardMarkup:
    """
    Create a keyboard that asks for the user's phone number.
    
    Returns:
        ReplyKeyboardMarkup with the share contact button
    """
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
        input_field_placeholder="Raqamingizni yuborish uchun pastdagi tugmani bosing"
    )
    
    return keyboard
