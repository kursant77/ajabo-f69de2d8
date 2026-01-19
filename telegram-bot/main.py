"""
Main entry point for the Telegram bot.
Starts both the Telegram bot polling and the FastAPI webhook server.
"""
import asyncio
from aiogram import Bot
from bot import bot, dp, WEBHOOK_HOST, WEBHOOK_PORT
from handlers import start, webapp, orders
from api.order_listener import app as webhook_app
from utils.logger import logger
import uvicorn


async def on_startup():
    """Execute on bot startup."""
    logger.info("Bot is starting up...")
    
    # Store bot instance in webhook app state
    webhook_app.state.bot = bot
    
    logger.info("Bot started successfully!")


async def on_shutdown():
    """Execute on bot shutdown."""
    logger.info("Bot is shutting down...")
    await supabase.aclose()
    await bot.session.close()
    logger.info("Bot shut down successfully!")


async def start_bot():
    """Start the bot polling."""
    # Register handlers
    dp.include_router(start.router)
    dp.include_router(webapp.router)
    dp.include_router(orders.router)
    
    # Register startup/shutdown handlers
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)
    
    # Start polling
    logger.info("Starting bot polling...")
    await dp.start_polling(bot)


async def start_webhook_server():
    """Start the FastAPI webhook server."""
    config = uvicorn.Config(
        app=webhook_app,
        host=WEBHOOK_HOST,
        port=WEBHOOK_PORT,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()


async def main():
    """
    Main function to run both bot and webhook server concurrently.
    """
    logger.info("Starting Telegram Bot and Webhook Server...")
    
    # Run bot polling and webhook server concurrently
    await asyncio.gather(
        start_bot(),
        start_webhook_server()
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise
