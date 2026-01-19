"""
Bot initialization and configuration.
"""
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from dotenv import load_dotenv
from supabase import create_client, Client
from utils.logger import logger

# Load environment variables
load_dotenv()

# Validate required environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    logger.error("BOT_TOKEN not found in environment variables!")
    raise ValueError("BOT_TOKEN is required")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") # Use existing key names or new ones
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase URL or Key not found in environment variables!")
    # Fallback to BACKEND_API_URL if it's actually the supabase URL (which it often is in these cases)
    SUPABASE_URL = os.getenv("BACKEND_API_URL")
    SUPABASE_KEY = os.getenv("API_SECRET_KEY")

if not SUPABASE_URL:
    raise ValueError("Supabase configuration is required")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000")
API_SECRET_KEY = os.getenv("API_SECRET_KEY")
if not API_SECRET_KEY:
    logger.error("API_SECRET_KEY not found in environment variables!")
    raise ValueError("API_SECRET_KEY is required for webhook security")

WEBSITE_URL = os.getenv("WEBSITE_URL", "http://localhost:5173")
WEBHOOK_HOST = os.getenv("WEBHOOK_HOST", "0.0.0.0")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))


# Initialize bot with default properties
bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

# Initialize dispatcher
dp = Dispatcher()

logger.info("Bot initialized successfully")
logger.info(f"Backend API URL: {BACKEND_API_URL}")
logger.info(f"Website URL: {WEBSITE_URL}")
logger.info(f"Webhook will run on {WEBHOOK_HOST}:{WEBHOOK_PORT}")
