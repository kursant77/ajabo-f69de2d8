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
    
    await message.answer(
        text,
        reply_markup=get_webapp_keyboard(telegram_id, full_name, phone)
    )
