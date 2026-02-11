"""
FastAPI webhook server for receiving order updates from backend.
"""
from fastapi import FastAPI, Header, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import hashlib
from aiogram import Bot
from services.notify_user import notify_user_order_status
from utils.id_formatter import format_order_id
from bot import API_SECRET_KEY, supabase
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
    order_type: Optional[str] = Field(None, description="Type of order: delivery, takeaway, preorder")


class DirectMessage(BaseModel):
    """Direct message payload model."""
    telegram_user_id: int = Field(..., description="User's Telegram ID")
    message: str = Field(..., description="Message content")


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
        product_name=order_update.product_name,
        order_type=order_update.order_type
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


async def update_order_status_db(order_id: str, status: str):
    """Helper to update order status in Supabase."""
    try:
        # First check if order is in pending_payment status (idempotency)
        res = await supabase.table("orders").select("status").eq("id", order_id).single()
        if res and res.get("status") == "pending_payment":
            await supabase.table("orders").update({"status": status}).eq("id", order_id)
            logger.info(f"✅ Order {order_id} status updated to {status} via payment callback")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Failed to update order status {order_id}: {e}")
        return False


@app.post("/api/payment/click/callback")
async def click_callback(
    click_trans_id: int = Form(...),
    service_id: int = Form(...),
    click_paydoc_id: int = Form(...),
    merchant_trans_id: str = Form(...),
    amount: float = Form(...),
    action: int = Form(...),
    error: int = Form(...),
    error_note: str = Form(...),
    sign_time: str = Form(...),
    sign_string: str = Form(...)
):
    """
    Click payment callback handler.
    Documentation: https://docs.click.uz/click-api-request/
    """
    logger.info(f"💰 Click callback received for order {merchant_trans_id}, action={action}")
    
    # 0 - Prepare, 1 - Complete
    if error < 0:
        return {"error": error, "error_note": error_note}

    if action == 1:
        if error == 0:
            # Payment successful
            success = await update_order_status_db(merchant_trans_id, "pending")
            if success:
                return {"error": 0, "error_note": "Success"}
            else:
                return {"error": -1, "error_note": "Order already processed or not found"}
    
    # Simple reply for Prepare (action=0)
    return {"error": 0, "error_note": "Success"}


@app.post("/api/payment/payme/callback")
async def payme_callback(request: Request):
    """
    Payme payment callback handler (JSON-RPC 2.0).
    Documentation: https://developer.help.paycom.uz/metody-merchant-api
    """
    data = await request.json()
    method = data.get("method")
    params = data.get("params", {})
    
    logger.info(f"💳 Payme callback received: method={method}")
    
    # Simplified logic for demonstration
    # In production, you must verify CheckPerformTransaction, PerformTransaction, etc.
    if method == "PerformTransaction":
        order_id = params.get("account", {}).get("order_id")
        if order_id:
            await update_order_status_db(order_id, "pending")
            return {
                "result": {
                    "transaction": params.get("id"),
                    "perform_time": int(datetime.utcnow().timestamp() * 1000),
                    "state": 2
                }
            }
            
    return {"result": {"success": True}}


@app.post("/api/send-message")
async def send_direct_message(
    payload: DirectMessage,
    request: Request,
    x_api_key: Optional[str] = Header(None)
):
    """
    Endpoint for sending direct messages to users via Telegram ID.
    """
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    bot: Bot = request.app.state.bot
    
    try:
        await bot.send_message(
            chat_id=payload.telegram_user_id,
            text=f"✉️ <b>Ajabo Burgerdan xabar:</b>\n\n{payload.message}",
            parse_mode="HTML"
        )
        return {"success": True, "message": "Message sent"}
    except Exception as e:
        logger.error(f"Failed to send direct message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
            "send_message": "/api/send-message",
            "health": "/health"
        }
    }
