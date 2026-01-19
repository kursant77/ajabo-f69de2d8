"""
Bot initialization and configuration.
"""
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from dotenv import load_dotenv
from postgrest import AsyncPostgrestClient
from utils.logger import logger

# Load environment variables
load_dotenv()

# Validate required environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    logger.error("BOT_TOKEN not found in environment variables!")
    raise ValueError("BOT_TOKEN is required")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Final fallback for backward compatibility
    if not SUPABASE_URL: SUPABASE_URL = os.getenv("BACKEND_API_URL")
    if not SUPABASE_KEY: SUPABASE_KEY = os.getenv("API_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_URL.startswith("http"):
    logger.error(f"Invalid Supabase URL: {SUPABASE_URL}")
    raise ValueError("Valid Supabase URL is required")

# Proxy class for lazy initialization of Supabase client
class SupabaseProxy:
    def __init__(self):
        self._instance = None

    def _get_instance(self):
        if self._instance is None:
            logger.info(f"Lazily initializing AsyncPostgrestClient with URL: {SUPABASE_URL}")
            self._instance = AsyncPostgrestClient(
                f"{SUPABASE_URL}/rest/v1",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}"
                }
            )
            # Add compatibility alias
            self._instance.table = self._instance.from_
        return self._instance

    def table(self, table_name):
        return self._get_instance().table(table_name)
    
    def from_(self, table_name):
        return self._get_instance().from_(table_name)

    async def aclose(self):
        if self._instance:
            await self._instance.aclose()
            self._instance = None

# Initialize the proxy
supabase = SupabaseProxy()
logger.info("Supabase proxy initialized (lazy load enabled)")

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
