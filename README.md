# 🥦 Smart Expiry Tracker

A modern full-stack web application designed to eliminate household food waste. It tracks grocery expiry dates, provides intelligent recipe suggestions to use ingredients in time, and recommends eco-friendly disposal or repurposing options (compost, fertilizer, skin care) for items that slipped past their date.

---

## ✨ Features

- **Inventory Dashboard**: Live tracking of grocery items with status tags (**Fresh**, **Expiring Soon**, **Expired**, **Used**).
- **Date & Timezone Resilient**: Strict start-of-day UTC comparisons prevent premature midday expiration and time-zone shifts.
- **Recipe Suggestions**: Pulls real recipes via the Spoonacular API for ingredients needing quick consumption.
- **Eco Disposal & Reuse Tips**: Category-based and item-specific suggestions (composting, plant fertilizer, DIY skin/hair care).
- **Proactive Alerts**:
  - **Browser Desktop Notifications**: Daily deduplicated popups for items about to expire.
  - **Provider-Swappable Email Alerts**: Daily email notifications using Brevo HTTP API (Render-friendly), Resend, or standard SMTP.
  - **Optional SMS Alerts**: Twilio text notifications behind a feature flag (`ENABLE_SMS_ALERTS`).
- **Account & Security**:
  - Encrypted passwords with bcrypt and secure 7-day JWT sessions.
  - Dual password recovery: secure email reset token link **or** secret security question.
  - Profile preferences: customize notification threshold (1, 2, 3, 5, or 7 days before expiry).
  - Rate limiting, Helmet security headers, dynamic CORS, and startup validation.

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Create React App), React Router 6, Axios, Custom CSS with CSS Variables & Tokens |
| **Backend** | Node.js, Express 4, Mongoose 8, Helmet, Express-Rate-Limit, Node-Cron, Nodemailer |
| **Database** | MongoDB Atlas (or local MongoDB Community Server) |
| **Integrations** | Spoonacular Food API, Brevo / Resend / Gmail SMTP, Twilio (optional) |
| **Testing & Quality** | Jest, Supertest, ESLint (Flat Config), Prettier |

---

## 📁 Project Structure

```
smart-expiry-tracker/
├── package.json               # Root scripts (install:all, dev, test, lint, build)
├── requirements.txt           # Project overview & system prerequisites
├── README.md                  # Comprehensive setup & operational guide
├── server/                    # Node.js + Express REST API
│   ├── server.js              # Express app entry, security headers, CORS, startup checks
│   ├── eslint.config.js       # ESLint flat configuration
│   ├── .prettierrc            # Prettier code formatting rules
│   ├── .env.example           # Server environment variables reference
│   ├── models/                # Mongoose models (User.js, Item.js)
│   ├── routes/                # API routes (auth, items, recipes, disposal, cron)
│   ├── middleware/            # Auth JWT verification & rate limiting
│   ├── utils/                 # dateUtils, emailService, smsService, expiryChecker, disposalSuggestions
│   └── tests/                 # Jest + Supertest suites (date calculations & route integration)
└── client/                    # React frontend application
    ├── package.json
    ├── .env.example           # Frontend environment variables reference
    ├── public/                # HTML template, viewport meta, favicon
    └── src/
        ├── App.js             # Client routing & authentication wrappers
        ├── api/axios.js       # Axios instance with 401 token auto-logout interceptor
        ├── context/           # AuthContext.js, ToastContext.js
        ├── components/        # Home, ItemCard, Profile, AddItemForm, EditItemForm, Modals, etc.
        ├── utils/dateUtils.js # Timezone-safe formatting and date mapping
        └── styles/index.css   # Clean CSS design system using CSS custom properties
```

---

## 🚀 Local Development Setup (Windows PowerShell)

### 1. Prerequisites

- **Node.js** v18+ installed (`node -v` in PowerShell).
- A free **MongoDB Atlas** connection string (or a local MongoDB instance).
- A free **Spoonacular API key** from [spoonacular.com/food-api](https://spoonacular.com/food-api).

### 2. Install Dependencies

From the project root:

```powershell
npm run install:all
```

*(This installs root, server, and client dependencies automatically).*

### 3. Configure Environment Variables

Create `server/.env` by copying `server/.env.example`:

```powershell
cd server
Copy-Item .env.example .env
```

Open `server/.env` in VS Code and fill in your values:

```ini
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smart-expiry-tracker
JWT_SECRET=replace_with_a_long_random_secret_string_min_16_chars
PORT=5000
CLIENT_URL=http://localhost:3000
SPOONACULAR_API_KEY=your_spoonacular_key_here
CRON_SECRET=my_custom_secret_token_123

# Email Provider: brevo | resend | smtp
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@example.com
```

Create `client/.env` by copying `client/.env.example`:

```powershell
cd ../client
Copy-Item .env.example .env
```

The default `REACT_APP_API_URL=http://localhost:5000/api` is already configured for local development.

### 4. Run Locally

From the project root:

```powershell
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Environment Variable Reference

### Server (`server/.env` and Render dashboard)

| Variable | Required? | Default | Description |
|---|---|---|---|
| `MONGO_URI` | **Yes** | — | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | — | Secret string for signing auth tokens (min 16 chars) |
| `PORT` | No | `5000` | Port for Express server |
| `CLIENT_URL` | **Yes** | `http://localhost:3000` | Allowed CORS origins. Comma-separated for multiple (e.g. `https://my-app.vercel.app,http://localhost:3000`) |
| `SPOONACULAR_API_KEY` | Recommended | — | Spoonacular API key for recipe suggestions |
| `CRON_SECRET` | Recommended | — | Secret token required to trigger `/api/cron/check-expiry` remotely |
| `EMAIL_PROVIDER` | No | Auto-detect | Email service: `brevo`, `resend`, or `smtp` |
| `BREVO_API_KEY` | If Brevo | — | Brevo API key (Settings → SMTP & API) |
| `BREVO_SENDER_EMAIL` | If Brevo | — | Verified sender email in Brevo account |
| `RESEND_API_KEY` | If Resend | — | Resend API key |
| `RESEND_SENDER_EMAIL` | If Resend | — | Verified sender email or `onboarding@resend.dev` |
| `EMAIL_USER` / `EMAIL_PASS` | If SMTP | — | Gmail address and 16-character App Password |
| `ENABLE_SMS_ALERTS` | No | `false` | Set to `true` to enable Twilio SMS text alerts |
| `TWILIO_ACCOUNT_SID` | If SMS | — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | If SMS | — | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | If SMS | — | Twilio Phone Number in E.164 format (e.g. `+1234567890`) |

### Client (`client/.env` and Vercel dashboard)

| Variable | Required? | Default | Description |
|---|---|---|---|
| `REACT_APP_API_URL` | **Yes** | `http://localhost:5000/api` | Full backend API URL (e.g. `https://my-backend.onrender.com/api`) |

---

## ⏰ Render Free Tier & Daily Expiry Notifications

Render's free tier spins down web services after 15 minutes of inactivity. When asleep, internal Node cron timers stop.

To guarantee that your expiry checks run every day on schedule, this project provides a protected remote trigger endpoint:

**Endpoint**: `GET /api/cron/check-expiry?secret=YOUR_CRON_SECRET`  
(Also supports `POST` with `x-cron-secret: YOUR_CRON_SECRET` header).

### How to set up free external scheduling:
1. Sign up for a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job.
3. Set the URL to:
   ```
   https://YOUR-BACKEND.onrender.com/api/cron/check-expiry?secret=YOUR_CRON_SECRET
   ```
4. Set schedule to run once daily (e.g. every day at 8:00 AM UTC).
5. When called, it wakes your Render service, checks expiring and expired items, sends email alerts, and returns JSON confirmation:
   ```json
   {
     "success": true,
     "expiringSoonProcessed": 2,
     "expiredProcessed": 1,
     "timestamp": "2026-10-22T08:00:00.000Z"
   }
   ```

---

## 🧪 Testing & Code Quality

Run tests from the root or server:

```powershell
# Run backend test suite (Jest + Supertest)
npm test

# Run ESLint check
npm run lint

# Build client production bundle
npm run build
```

---

## 🌐 Production Deployment

### 1. Backend (Render)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Add all required environment variables in the Render Dashboard (**Environment** tab).
- Note: Keep `CLIENT_URL` pointing to your Vercel URL (e.g. `https://smart-expiry-tracker-eta.vercel.app,http://localhost:3000`).

### 2. Frontend (Vercel)
- **Root Directory**: `client`
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- In **Environment Variables**, add:
  `REACT_APP_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api`

---

## 🛠️ Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `Startup Error: Missing required environment variable(s)` | `MONGO_URI` or `JWT_SECRET` is unset | Ensure `server/.env` contains valid values |
| `CORS blocked request from origin: ...` | Frontend domain not in `CLIENT_URL` | Add your Vercel URL to `CLIENT_URL` in `server/.env` (comma-separated) |
| Recipe search returns 503 | `SPOONACULAR_API_KEY` missing or default | Add a valid key from spoonacular.com/food-api to `server/.env` |
| Emails failing on Render | Gmail SMTP port 587 is blocked by Render free tier | Use `EMAIL_PROVIDER=brevo` with a free Brevo API key and verified sender |
| 401 on every request | Token expired (after 7 days) | Log in again; the app will auto-redirect to `/login` |
