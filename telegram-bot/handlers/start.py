"""
Handler for /start command.
"""
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State

from bot import supabase, logger, WEBSITE_URL
from keyboards.reply import get_main_menu_keyboard, get_contact_keyboard
import urllib.parse

router = Router()

class Registration(StatesGroup):
    waiting_for_contact = State()
    waiting_for_name = State()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Handle /start command."""
    user = message.from_user
    telegram_id = user.id
    
    logger.info(f"User {telegram_id} started the bot")
    
    # Check if user exists in Supabase
    try:
        logger.info(f"Checking profile for telegram_id: {telegram_id}")
        response = await supabase.table("profiles").select("*").eq("telegram_id", telegram_id).execute()
        logger.info(f"Supabase response received: {response}")
        
        if response.data:
            # User exists, show main menu
            profile = response.data[0]
            
            # Generate Web App URL with user data for auto-filling
            params = {
                "telegram_user_id": telegram_id,
                "full_name": profile.get("full_name", ""),
                "phone": profile.get("phone", "")
            }
            query_string = urllib.parse.urlencode(params)
            web_app_url = f"{WEBSITE_URL}?{query_string}"
            
            welcome_text = (
                f"👋 <b>Assalomu alaykum, {profile.get('full_name')}!</b>\n\n"
                "Buyurtma berish uchun quyidagi tugmani bosing:"
            )
            await message.answer(
                welcome_text, 
                reply_markup=get_main_menu_keyboard(web_app_url=web_app_url)
            )
            await state.clear()
        else:
            # New user, start registration
            welcome_text = (
                f"👋 <b>Assalomu alaykum, {user.first_name}!</b>\n\n"
                "Bizning yetkazib berish botimizga xush kelibsiz! 🍔\n"
                "Davom etishdan oldin raqamingizni yuboring:"
            )
            await message.answer(welcome_text, reply_markup=get_contact_keyboard())
            await state.set_state(Registration.waiting_for_contact)
            
    except Exception as e:
        logger.error(f"Error checking profile: {e}")
        await message.answer("Xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.")


@router.message(Registration.waiting_for_contact, F.contact)
async def handle_contact(message: Message, state: FSMContext):
    """Handle contact sharing."""
    contact = message.contact
    phone = contact.phone_number
    
    # Clean phone number (remove +)
    if not phone.startswith('+'):
        phone = f"+{phone}"
        
    await state.update_data(phone=phone)
    
    await message.answer(
        "Rahmat! Endi ismingizni kiriting:",
        reply_markup=ReplyKeyboardRemove()
    )
    await state.set_state(Registration.waiting_for_name)


@router.message(Registration.waiting_for_name)
async def handle_name(message: Message, state: FSMContext):
    """Handle name input and complete registration."""
    full_name = message.text
    user_data = await state.get_data()
    phone = user_data.get("phone")
    telegram_id = message.from_user.id
    
    # Save to Supabase
    try:
        profile_data = {
            "telegram_id": telegram_id,
            "phone": phone,
            "full_name": full_name,
            "username": message.from_user.username
        }
        
        logger.info(f"Upserting profile for user {telegram_id}")
        await supabase.table("profiles").upsert(profile_data).execute()
        logger.info(f"Profile upserted successfully for {telegram_id}")
        
        # Generate Web App URL for the new user
        params = {
            "telegram_user_id": telegram_id,
            "full_name": full_name,
            "phone": phone
        }
        query_string = urllib.parse.urlencode(params)
        web_app_url = f"{WEBSITE_URL}?{query_string}"
        
        await message.answer(
            f"Tabriklaymiz, {full_name}! Ro'yxatdan muvaffaqiyatli o'tdingiz. ✅",
            reply_markup=get_main_menu_keyboard(web_app_url=web_app_url)
        )
        await state.clear()
        
    except Exception as e:
        logger.error(f"Error saving profile: {e}")
        await message.answer("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.")
        # Optionally reset or keep state
