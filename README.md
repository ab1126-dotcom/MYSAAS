# 🎬 ClipAI — AI-Powered Viral Clip Finder SaaS

YouTube videos se automatically viral clips nikalo with AI.

---

## 🚀 Features

- **Viral Clip Detection** — AI timestamps find karta hai jo viral ho sakti hain
- **Hook Generator** — 5 styles mein viral hooks (FREE)
- **SEO Package** — Titles, hashtags, posting time (FREE)
- **Comment Analysis** — 100 comments analyze → next video ideas (PAID)
- **Free/Paid Tier** — 3 clips free, unlimited paid

---

## 📁 Project Structure

```
clipai/
├── frontend/     → React + Vite → Deploy on Netlify
└── backend/      → Node.js + Express → Deploy on Railway
```

---

## 🔑 API Keys Chahiye

### 1. Anthropic API Key
- https://console.anthropic.com
- `ANTHROPIC_API_KEY=sk-ant-...`

### 2. YouTube Data API v3
- https://console.cloud.google.com
- New Project → Enable "YouTube Data API v3" → Create API Key
- `YOUTUBE_API_KEY=AIza...`

---

## 💻 Local Development

### Backend Setup
```bash
cd backend
cp .env.example .env
# .env mein apni API keys daalo
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# .env mein VITE_API_URL set karo (dev mein proxy hoga)
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🚢 Deployment

### Backend → Railway

1. https://railway.app pe account banao
2. "New Project" → "Deploy from GitHub repo"
3. Backend folder select karo
4. Environment variables add karo:
   ```
   ANTHROPIC_API_KEY=your_key
   YOUTUBE_API_KEY=your_key
   FRONTEND_URL=https://your-app.netlify.app
   NODE_ENV=production
   PORT=5000
   ```
5. Deploy! Railway URL copy karo (e.g., `https://clipai-backend.up.railway.app`)

### Frontend → Netlify

1. https://netlify.com pe account banao
2. "New site from Git" → GitHub repo connect karo
3. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Environment variables add karo:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
5. Deploy!

---

## 💳 Payment Integration (Real App Ke Liye)

Abhi demo mein direct Pro toggle hai. Real payments ke liye:

### Razorpay (India ke liye best)
```bash
npm install razorpay
```

```javascript
// backend mein payment route add karo
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post('/api/payment/create-order', async (req, res) => {
  const order = await razorpay.orders.create({
    amount: 49900, // ₹499 in paise
    currency: 'INR',
    receipt: 'receipt_' + Date.now()
  });
  res.json(order);
});
```

### Stripe (International)
```bash
npm install stripe
```

---

## 🔧 Production Improvements

1. **Database**: MongoDB/PostgreSQL for user management
2. **Auth**: JWT tokens ya Clerk.dev
3. **Cache**: Redis for YouTube API caching
4. **Limits**: Per-user usage in DB instead of in-memory
5. **Webhooks**: Payment confirmation se automatically upgrade karo

---

## 📞 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express |
| AI | Claude claude-sonnet-4 (Anthropic) |
| Data | YouTube Data API v3 |
| Deployment | Netlify (FE) + Railway (BE) |

---

Made with ❤️ for Content Creators
