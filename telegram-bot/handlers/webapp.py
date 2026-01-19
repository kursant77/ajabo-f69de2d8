"""
Handler for Web App button and interactions.
"""
from aiogram import Router, F
from aiogram.types import Message
from bot import supabase, logger
from keyboards.inline import get_webapp_keyboard
from utils.logger import logger

router = Router()


@router.message(F.text == "🍔 Buyurtma berish")
async def handle_order_button(message: Message):
    """
    Handle the 'Buyurtma berish' button click.
    Opens the website as a Telegram Web App.
    """
    user = message.from_user
    telegram_id = user.id
    
    logger.info(f"User {telegram_id} clicked order button")
    
    # Try to get user profile for pre-filling
    full_name = None
    phone = None
    
    try:
        logger.info(f"WebApp: Checking profile for {telegram_id}")
        response = await supabase.table("profiles").select("*").eq("telegram_id", telegram_id).execute()
        if response.data:
            profile = response.data[0]
            full_name = profile.get("full_name")
            phone = profile.get("phone")
    except Exception as e:
        logger.error(f"Error fetching profile for webapp: {e}")

    text = (
        "🍔 <b>Buyurtma berish</b>\n\n"
        "Pastdagi tugmani bosing va taomlarimizni ko'ring!"
    )
    
    logger.info(f"Generating webapp keyboard for user {telegram_id}")
    
    is_localhost = "localhost" in web_app_url or "127.0.0.1" in web_app_url
    
    if is_localhost:
        logger.warning(f"Localhost detected in URL: {web_app_url}. Sending as text because Telegram buttons don't support localhost.")
        # Generate the URL manually for text response
        params = {
            "telegram_user_id": telegram_id,
        }
        if full_name: params["full_name"] = full_name
        if phone: params["phone"] = phone
        
        import urllib.parse
        final_url = f"{web_app_url.split('?')[0]}?{urllib.parse.urlencode(params)}"
        
        await message.answer(
            f"🛠 <b>Localhost testi aniqlandi</b>\n\n"
            f"Telegram tugmalari <code>localhost</code> havolalarini qo'llab-quvvatlamaydi. "
            f"Iltimos, saytni ochish uchun quyidagi havola ustiga bosing:\n\n"
            f"🔗 <a href='{final_url}'>{final_url}</a>\n\n"
            f"<i>Eslatma: Haqiqiy foydalanishda (HTTPS bilan) bu tugma ko'rinishida bo'ladi.</i>"
        )
        return

    keyboard = get_webapp_keyboard(telegram_id, full_name, phone)
    
    logger.info(f"Keyboard generated. Sending response to user {telegram_id}...")
    try:
        await message.answer(
            text,
            reply_markup=keyboard
        )
        logger.info(f"Response sent successfully to user {telegram_id}")
    except Exception as e:
        logger.error(f"Failed to send webapp keyboard to {telegram_id}: {e}")
        await message.answer(
            f"❌ Tugma yuborishda xatolik yuz berdi. Iltimos, ushbu havoladan foydalaning:\n\n{web_app_url}"
        )
