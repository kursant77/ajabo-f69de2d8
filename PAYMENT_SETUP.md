# 💳 AJABO — To'lov Tizimini Sozlash Bo'yicha To'liq Qo'llanma

## Mundarija

1. [Umumiy Ko'rinish](#1-umumiy-korinish)
2. [Loyiha Tuzilishi](#2-loyiha-tuzilishi)
3. [.env Sozlash (MUHIM!)](#3-env-sozlash-muhim)
4. [Supabase Bazasini Sozlash](#4-supabase-bazasini-sozlash)
5. [To'lov Tizimlari Bilan Shartnoma](#5-tolov-tizimlari-bilan-shartnoma)
6. [To'lov Oqimi (Payment Flow)](#6-tolov-oqimi-payment-flow)
7. [Telegram Bot Sozlash](#7-telegram-bot-sozlash)
8. [Production'ga Chiqarish](#8-productionga-chiqarish)
9. [Test Qilish](#9-test-qilish)
10. [Xatolarni Bartaraf Etish](#10-xatolarni-bartaraf-etish)

---

## 1. Umumiy Ko'rinish

Ajabo loyihasining to'lov tizimi quyidagi usullarni qo'llab-quvvatlaydi:

| To'lov usuli | Turi | Holat |
|---|---|---|
| 💵 **Naqd pul** | Offline | ✅ Har doim ishlaydi |
| 💙 **Click** | Online | ⚙️ .env da sozlash kerak |
| 💚 **Payme** | Online | ⚙️ .env da sozlash kerak |
| 💜 **Uzum Bank** | Online | ⚙️ .env da sozlash kerak |
| 🔵 **Paynet** | Online | ⚙️ .env da sozlash kerak |

> [!IMPORTANT]
> Online to'lov usullari **faqat .env faylida merchant ma'lumotlari kiritilganda** ishlaydi. Agar kiritilmasa, foydalanuvchiga faqat "Naqd pul" ko'rsatiladi.

---

## 2. Loyiha Tuzilishi

To'lov tizimiga tegishli fayllar:

```
ajabo/
├── website/
│   ├── .env                              ← 🔑 Barcha kalitlar shu yerda
│   └── src/
│       ├── services/
│       │   └── paymentService.ts          ← To'lov URL generatsiyasi
│       ├── components/
│       │   ├── OrderModal.tsx             ← Buyurtma modali (to'lov tanlash)
│       │   ├── payment/
│       │   │   └── PaymentLogos.tsx       ← To'lov logolari (SVG)
│       │   ├── admin/
│       │   │   ├── AdminOrderCard.tsx     ← Admin panelda buyurtma karta
│       │   │   └── AdminOrderModal.tsx    ← Admin buyurtma yaratish
│       │   └── delivery/
│       │       └── OrderCard.tsx          ← Delivery panelda buyurtma karta
│       ├── hooks/
│       │   ├── useSupabaseOrders.ts       ← Buyurtma CRUD operatsiyalari
│       │   └── useAdminOrdersQuery.ts     ← Admin buyurtmaları query
│       ├── lib/
│       │   ├── supabase.ts               ← Supabase client
│       │   └── telegram.ts               ← Telegram bot webhook
│       ├── pages/
│       │   └── Index.tsx                  ← Asosiy sahifa (payment callback)
│       └── data/
│           ├── deliveryData.ts            ← Order interface
│           └── adminData.ts              ← AdminOrder interface
│
└── telegram-bot/
    ├── .env                              ← Bot token va sozlamalar
    ├── bot.py                            ← Bot konfiguratsiyasi
    └── api/
        └── order_listener.py             ← Webhook (order status updates)
```

---

## 3. .env Sozlash (MUHIM!)

### 📁 `website/.env`

Bu fayl to'lov tizimining asosiy konfiguratsiya fayli:

```env
# ===== SUPABASE =====
VITE_SUPABASE_URL=https://squekdvznjkijtsdygum.supabase.co
VITE_SUPABASE_ANON_KEY=SIZ_OLGAN_ANON_KEY

# ===== TELEGRAM BOT =====
VITE_TELEGRAM_BOT_WEBHOOK_URL=http://localhost:8082/api/order-update
VITE_API_SECRET_KEY=354203985025053780347902379347927030224

# ===== TO'LOV TIZIMLARI (Merchant kalitlari) =====
# Click (https://click.uz/dev dan olinadi)
VITE_CLICK_SERVICE_ID=sizning_click_service_id
VITE_CLICK_MERCHANT_ID=sizning_click_merchant_id

# Payme (https://developer.help.paycom.uz dan olinadi)
VITE_PAYME_MERCHANT_ID=sizning_payme_merchant_id

# Uzum Bank
VITE_UZUM_MERCHANT_ID=sizning_uzum_merchant_id

# Paynet
VITE_PAYNET_SERVICE_ID=sizning_paynet_service_id
```

> [!CAUTION]
> **QOIDALAR:**
> - `.env` faylini **HECH QACHON** GitHub ga push qilmang!
> - `.gitignore` da `.env` bo'lishi **SHART**
> - Faqat **haqiqiy** merchant ID larni kiriting, placeholder qoldirmang
> - Agar biror to'lov tizimi bilan shartnomangiz bo'lmasa — o'sha qatorni **bo'sh qoldiring**. Bu holda u foydalanuvchiga ko'rsatilmaydi

### 📁 `telegram-bot/.env`

```env
# Telegram botning token'i (@BotFather dan olinadi)
BOT_TOKEN=sizning_bot_token

# Supabase
SUPABASE_URL=https://squekdvznjkijtsdygum.supabase.co
SUPABASE_KEY=sizning_supabase_anon_key

# API xavfsizligi (website bilan bir xil bo'lishi SHART)
API_SECRET_KEY=354203985025053780347902379347927030224

# Website URL
WEBSITE_URL=https://ajabo.vercel.app

# Webhook server
WEBHOOK_HOST=0.0.0.0
WEBHOOK_PORT=8082
```

> [!WARNING]
> `API_SECRET_KEY` qiymati **website** va **telegram-bot** da bir xil bo'lishi SHART! Aks holda webhook xavfsizlik tekshiruvidan o'tmaydi.

---

## 4. Supabase Bazasini Sozlash

### `orders` jadvali

Supabase SQL Editor da quyidagi ustunlar bo'lishi kerak. Agar `payment_method` va `order_type` ustunlari mavjud bo'lmasa, qo'shing:

```sql
-- payment_method ustuni qo'shish (agar yo'q bo'lsa)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

-- order_type ustuni qo'shish (agar yo'q bo'lsa)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';

-- warehouse_deducted ustuni qo'shish (agar yo'q bo'lsa)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS warehouse_deducted BOOLEAN DEFAULT FALSE;
```

### To'liq `orders` jadvali tuzilishi:

| Ustun | Turi | Tavsif |
|---|---|---|
| `id` | uuid (PK) | Avtomatik yaratiladi |
| `product_name` | text | Mahsulot nomi |
| `quantity` | integer | Miqdor |
| `customer_name` | text | Mijoz ismi |
| `phone_number` | text | Telefon raqam |
| `status` | text | `pending`, `ready`, `on_way`, `delivered`, `pending_payment` |
| `address` | text | Manzil |
| `created_at` | timestamptz | Yaratilgan vaqt |
| `total_price` | numeric | Umumiy narx (so'mda) |
| `delivery_person` | text | Yetkazuvchi ismi |
| `telegram_user_id` | bigint | Telegram user ID |
| `order_type` | text | `delivery`, `takeaway`, `preorder` |
| `payment_method` | text | `click`, `payme`, `paynet`, `uzum`, `cash` |
| `warehouse_deducted` | boolean | Ombordan yechilganmi |

### Real-time yoqish

Supabase Dashboard → Database → Replication → `orders` jadvalini **Enable** qiling (INSERT, UPDATE, DELETE).

---

## 5. To'lov Tizimlari Bilan Shartnoma

Har bir to'lov tizimini ishga tushirish uchun quyidagi qadamlarni bajaring:

### 💙 Click

1. **https://click.uz** ga kiring
2. **"Для бизнеса"** → **"Подключить Click"** bosing
3. Hujjatlarni to'ldiring (INN, Guvohnoma, ariza)
4. Tasdiqlangandan so'ng **Service ID** va **Merchant ID** beriladi
5. `.env` ga yozing:
   ```
   VITE_CLICK_SERVICE_ID=12345
   VITE_CLICK_MERCHANT_ID=67890
   ```

### 💚 Payme

1. **https://payme.uz/business** ga kiring
2. **"Стать мерчантом"** bosing
3. Hujjatlarni to'ldiring
4. Tasdiqlangandan so'ng **Merchant ID** beriladi
5. `.env` ga yozing:
   ```
   VITE_PAYME_MERCHANT_ID=67890abcdef1234567890
   ```

### 💜 Uzum Bank

1. **Uzum Bank** bilan bog'laning: biznes bo'lim
2. Shartnoma imzolang
3. **Merchant ID** oling
4. `.env` ga yozing:
   ```
   VITE_UZUM_MERCHANT_ID=112233
   ```

### 🔵 Paynet

1. **https://paynet.uz** ga murojaat qiling
2. Shartnoma imzolang
3. **Service ID** oling
4. `.env` ga yozing:
   ```
   VITE_PAYNET_SERVICE_ID=556677
   ```

> [!TIP]
> Avvaliga **faqat bitta** to'lov tizimini ulang (masalan Click). Uni to'liq test qilib, so'ng boshqalarini qo'shing.

---

## 6. To'lov Oqimi (Payment Flow)

Buyurtma berilganda to'lov qanday ishlaydi:

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ Mijoz modal  │────▶│ addOrder()   │────▶│ Supabase DB    │
│ da to'lov    │     │ status:      │     │ orders jadvali │
│ usulini      │     │ pending_     │     │                │
│ tanlaydi     │     │ payment      │     │                │
└─────────────┘     └──────────────┘     └────────────────┘
       │
       ▼
┌─────────────────┐
│ generatePayment │
│ Url() chaqiriladi│
└─────────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Click/Payme/Uzum/   │────▶│ Mijoz to'lov     │
│ Paynet sahifasiga   │     │ qiladi           │
│ redirect bo'ladi    │     │                  │
└─────────────────────┘     └──────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Return URL ga  │
                           │ qaytadi:       │
                           │ ?payment_      │
                           │ status=success │
                           └────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Index.tsx      │
                           │ useEffect:     │
                           │ status →       │
                           │ "pending"      │
                           │ (tasdiqlandi)  │
                           └────────────────┘
```

### Naqd to'lov:
```
Mijoz → addOrder(status: "pending") → Telegram bot xabar oladi → Tayyorlanadi
```

### Online to'lov:
```
Mijoz → addOrder(status: "pending_payment") → Redirect → To'lov → Qaytadi → status: "pending"
```

---

## 7. Telegram Bot Sozlash

### 1-qadam: Bot yaratish
1. Telegram da **@BotFather** ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting
4. **BOT_TOKEN** ni `.env` ga yozing

### 2-qadam: Bot'ni ishga tushirish
```bash
cd telegram-bot
pip install -r requirements.txt
python main.py
```

### 3-qadam: Webhook test
```bash
curl -X POST http://localhost:8082/api/order-update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 354203985025053780347902379347927030224" \
  -d '{"order_id": "test-123", "telegram_user_id": 123456, "status": "confirmed", "product_name": "Burger"}'
```

Javob `{"success": true}` bo'lishi kerak.

---

## 8. Production'ga Chiqarish

### Vercel (Website)

1. **Vercel Dashboard** → loyihangiz → **Settings** → **Environment Variables**
2. Quyidagi o'zgaruvchilarni qo'shing:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `VITE_TELEGRAM_BOT_WEBHOOK_URL` | Production webhook URL |
| `VITE_API_SECRET_KEY` | API secret key |
| `VITE_CLICK_SERVICE_ID` | Click Service ID |
| `VITE_CLICK_MERCHANT_ID` | Click Merchant ID |
| `VITE_PAYME_MERCHANT_ID` | Payme Merchant ID |
| `VITE_UZUM_MERCHANT_ID` | Uzum Merchant ID |
| `VITE_PAYNET_SERVICE_ID` | Paynet Service ID |

3. **Redeploy** qiling

> [!WARNING]
> `VITE_TELEGRAM_BOT_WEBHOOK_URL` production da **haqiqiy server URL** bo'lishi kerak, `localhost` EMAS!
> Masalan: `https://api.ajabo.uz/api/order-update`

### VPS (Telegram Bot)

1. `.env` faylini serverga ko'chiring
2. `WEBSITE_URL` ni production URL ga o'zgartiring
3. Bot'ni systemd yoki PM2 bilan ishga tushiring

---

## 9. Test Qilish

### Build test (lokal)
```bash
cd website
npx tsc --noEmit   # TypeScript xatolar tekshirish
npx vite build     # Production build
npm run dev        # Dev serverni ishga tushirish
```

### To'lov tizimini test qilish

1. ✅ **Naqd to'lov** — har doim ishlashi kerak (hech qanday sozlash talab qilinmaydi)
2. ⚙️ **Online to'lov test** — faqat .env da merchant kiritilgandan so'ng:
   - Buyurtma bering → online to'lovni tanlang → redirect qilinishini ko'ring
   - To'lovdan qaytganda URL da `?payment_status=success` bo'lishini tekshiring
   - Buyurtma holati `pending_payment` → `pending` ga o'zgarishini tekshiring

### Tekshirish ro'yxati (Checklist)

- [ ] `.env` da VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY bor
- [ ] `.env` da VITE_TELEGRAM_BOT_WEBHOOK_URL bor
- [ ] `.env` da VITE_API_SECRET_KEY bor
- [ ] `.env` da kamida bitta to'lov merchant ID kiritilgan
- [ ] Supabase `orders` jadvalida `payment_method` ustuni bor
- [ ] Supabase `orders` jadvalida `order_type` ustuni bor
- [ ] Supabase `orders` da Real-time yoqilgan
- [ ] Telegram bot `.env` da BOT_TOKEN bor
- [ ] Telegram bot `.env` da API_SECRET_KEY website bilan bir xil
- [ ] `npx tsc --noEmit` xatosiz o'tadi
- [ ] `npx vite build` xatosiz o'tadi
- [ ] Naqd to'lov bilan buyurtma berib ko'rildi
- [ ] Online to'lov redirect ishlaydi (merchant kiritilgandan so'ng)

---

## 10. Xatolarni Bartaraf Etish

| Muammo | Sabab | Yechim |
|---|---|---|
| To'lov usullari ko'rinmaydi | `.env` da merchant ID yo'q | `.env` ga haqiqiy ID kiriting |
| "To'lov tizimi hali sozlanmagan" toast | Merchant konfiguratsiyasi bo'sh | `.env` ni to'ldiring |
| Supabase "column does not exist" | `payment_method` ustuni yo'q | Yuqoridagi SQL ni bajaring |
| Webhook 401 Unauthorized | `API_SECRET_KEY` mos kelmaydi | Ikki `.env` da bir xil kalit bo'lsin |
| Bot xabar yubormaydi | `BOT_TOKEN` noto'g'ri | @BotFather dan qayta oling |
| Real-time ishlamaydi | Replication yoqilmagan | Supabase Dashboard → Replication |
| Payment redirect ishlamaydi (production) | `WEBSITE_URL` localhost | Production URL ga o'zgartiring |

---

> [!NOTE]
> Bu qo'llanma **2026-yil Fevral** holatiga ko'ra yozilgan. To'lov tizimi API lari vaqt o'tishi bilan o'zgarishi mumkin. Har doim rasmiy dokumentatsiyani tekshiring.
