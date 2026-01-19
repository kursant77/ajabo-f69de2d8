# 📦 Telegram Bot for Food Delivery System

Professional, production-ready Telegram Bot built with `aiogram 3.x` and `FastAPI`. 

---

## 🛠 Deployment Options

### Option A: Docker (Recommended)
The most reliable way to deploy in production.

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your production tokens
   ```

2. **Build and Start**:
   ```bash
   docker-compose up -d --build
   ```

3. **Check Logs**:
   ```bash
   docker-compose logs -f
   ```

### Option B: Linux VPS (systemd)
For direct deployment on a Linux server (Ubuntu/Debian).

1. **Setup Environment**:
   ```bash
   cd telegram-bot
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

2. **Configure Service**:
   Edit `bot.service.template`, set the correct paths, and save it as `/etc/systemd/system/telegram-bot.service`.

3. **Start Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable telegram-bot
   sudo systemctl start telegram-bot
   ```

---

## 🔗 Backend Integration Guide

The bot exposes a secure API endpoint that your backend must call.

### Endpoint: `POST http://<vps-ip>:8080/api/order-update`

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: <YOUR_API_SECRET_KEY>`

**Payload:**
```json
{
  "order_id": "ORD-12345",
  "telegram_user_id": 12345678,
  "status": "confirmed"
}
```

### Available Statuses:
- `confirmed`: ✅ Buyurtmangiz qabul qilindi. (Mapped from website `pending`)
- `ready`: 🍳 Buyurtmangiz tayyor bo‘ldi.
- `delivering`: 🚚 Buyurtmangiz yetkazilmoqda. (Mapped from website `on_way`)
- `delivered`: ✅ Buyurtmangiz yetkazib berildi.

---

## 📝 Logging & Monitoring
- **Logs**: In Docker, logs are stored in the `./logs/` directory.
- **Health Check**: `GET /health` returns the current status of the webhook server.
- **Production Logs**: Both console and file logging are enabled.

## 🔒 Security Best Practices
1. **Firewall**: Limit access to port `8080` only from your backend server IP if possible.
2. **Reverse Proxy**: Use Nginx with SSL (Let's Encrypt) to expose the webhook securely via HTTPS.
3. **Secret Key**: Use a strong, random string for `API_SECRET_KEY`.

---

## 🇺🇿 Uzbek Language Default
All user-facing messages are professionally translated into Uzbek.
