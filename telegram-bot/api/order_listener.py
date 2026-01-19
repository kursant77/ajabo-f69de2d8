"""
FastAPI webhook server for receiving order updates from backend.
"""
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from aiogram import Bot
from services.notify_user import notify_user_order_status
from utils.id_formatter import format_order_id
from bot import API_SECRET_KEY
from utils.logger import logger

# Create FastAPI app
app = FastAPI(title="Telegram Bot Webhook")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, you might want to restrict this to WEBSITE_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrderUpdate(BaseModel):
    """Order update payload model."""
    order_id: str = Field(..., description="Unique order ID")
    telegram_user_id: int = Field(..., description="User's Telegram ID")
    status: str = Field(
        ...,
        description="Order status: confirmed, ready, delivering, delivered"
    )
    timestamp: Optional[str] = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Timestamp of the update"
    )
    product_name: Optional[str] = Field(None, description="Name of the product")


@app.post("/api/order-update")
async def order_update_webhook(
    order_update: OrderUpdate,
    request: Request,
    x_api_key: Optional[str] = Header(None)
):
    """
    Webhook endpoint for receiving order updates from backend.
    
    Args:
        order_update: Order update data
        request: FastAPI request object
        x_api_key: API key from header
        
    Returns:
        dict with success status
        
    Raises:
        HTTPException: If authentication fails or notification fails
    """
    # Validate API key
    if x_api_key != API_SECRET_KEY:
        logger.warning(
            f"Unauthorized webhook attempt from {request.client.host}"
        )
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    logger.info(
        f"Received order update: Order {order_update.order_id}, "
        f"User {order_update.telegram_user_id}, Status {order_update.status}"
    )
    
    # Get bot instance from app state
    bot: Bot = request.app.state.bot
    
    # Send notification to user
    result = await notify_user_order_status(
        bot=bot,
        telegram_user_id=order_update.telegram_user_id,
        order_id=order_update.order_id,
        status=order_update.status,
        product_name=order_update.product_name
    )
    
    if not result["success"]:
        logger.error(f"Failed to send notification: {result['message']}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {result['message']}"
        )
    
    return {
        "success": True,
        "message": "Notification sent successfully",
        "order_id": order_update.order_id,
        "telegram_user_id": order_update.telegram_user_id
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "telegram-bot-webhook"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Telegram Bot Webhook Server",
        "version": "1.0.0",
        "endpoints": {
            "order_update": "/api/order-update",
            "health": "/health"
        }
    }
