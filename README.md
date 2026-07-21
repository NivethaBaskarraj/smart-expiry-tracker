# 🥦 Smart Expiry Tracker

A full-stack web application that helps reduce household food waste by tracking grocery
expiry dates, suggesting recipes for items that need to be used soon, and giving
eco-friendly disposal/reuse suggestions for items that have expired.

---

## ✨ Features

- **User authentication** — sign up / log in with JWT-based sessions
- **Add grocery items** with name, category, quantity, and expiry date
- **Status-based tracking** — items are visually flagged as OK, expiring soon, expired,
  or used, and remain in the log until the user deletes them
- **Recipe suggestions** — pulls real recipes from the Spoonacular API based on an
  ingredient close to expiry
- **Disposal / reuse suggestions** — category-aware tips for expired items (composting,
  plant fertilizer, skin & hair care uses, etc.), with extra item-specific tips for
  common foods (banana peels, eggshells, coffee grounds, citrus, and more)
- **Notifications** — browser (desktop) notifications for items expiring soon, plus
  automated daily email alerts for items expiring soon or already expired
- **Used / Delete controls** — mark an item as used once consumed, or delete it
  permanently from the log at any time

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JSON Web Tokens (JWT), bcrypt for password hashing |
| Email | Nodemailer (Gmail SMTP) |
| Scheduled jobs | node-cron |
| Recipes | Spoonacular Food API |
| Dev tooling | nodemon, concurrently |

---

## 📁 Project Structure

```
smart-expiry-tracker/
├── package.json          # root — runs client & server together
├── server/                # Express API
│   ├── server.js
│   ├── models/            # User.js, Item.js
│   ├── routes/             # auth.js, items.js, recipes.js, disposal.js
│   ├── middleware/         # auth.js (JWT verification)
│   ├── utils/               # emailService.js, expiryChecker.js, disposalSuggestions.js
│   └── .env                 # your local secrets (not committed)
├── client/                 # React app
│   └── src/
│       ├── components/     # Login, Register, Home, ItemCard, AddItemForm, etc.
│       ├── context/          # AuthContext.js
│       └── api/                # axios instance
└── README.md
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier) *or* a local MongoDB install
- A free [Spoonacular API](https://spoonacular.com/food-api) key
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for sending email alerts

---

## 🚀 Setup

### 1. Install dependencies (all three package.json files)

```bash
npm run install:all
```

### 2. Configure environment variables

Copy the example env file and fill in your own values:

```bash
cd server
copy .env.example .env      # Windows
# or: cp .env.example .env   # macOS/Linux
```

Fill in `server/.env`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
PORT=5000
SPOONACULAR_API_KEY=your_spoonacular_api_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:3000
```

Also set up the client env (usually no changes needed):

```bash
cd ../client
copy .env.example .env      # Windows
# or: cp .env.example .env
```

### 3. Run the app

From the **project root** (one level above `server` and `client`):

```bash
npm run dev
```

This starts both the backend (`http://localhost:5000`) and frontend
(`http://localhost:3000`) together in one terminal.

> Prefer running them separately? `npm run server` and `npm run client` (in two terminals)
> also work.

---

## 🔑 Environment Variable Reference

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers → Node.js connection string |
| `JWT_SECRET` | Any random string — generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SPOONACULAR_API_KEY` | spoonacular.com/food-api → sign up → Profile & API Key |
| `EMAIL_USER` / `EMAIL_PASS` | Your Gmail address + an App Password from myaccount.google.com/apppasswords |
| `CLIENT_URL` | The URL your React app runs on (default `http://localhost:3000`) |

---

## 🧪 How Notifications Work

- A daily cron job (`server/utils/expiryChecker.js`) runs once at 8:00 AM and also once
  on server startup:
  - Items expiring within 2 days → email alert sent, flagged so it isn't re-sent
  - Items past their expiry date → email alert sent, item status flips to `expired`
- The React app requests browser notification permission on load and shows a native
  desktop pop-up for items expiring soon (deduplicated per day via `localStorage`)

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection error` | Check `MONGO_URI`; make sure your IP is allowed in Atlas → Network Access → IP Access List |
| Recipes return a 500 error | Check `SPOONACULAR_API_KEY` and your daily quota (150 requests/day on the free tier) |
| No emails arriving | Confirm `EMAIL_PASS` is a Gmail **App Password** (no spaces), not your normal password; check spam |
| `npm install` fails with a PowerShell script error (Windows) | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, confirm with `Y` |
| `package.json` fails with `EJSONPARSE` | The file was saved with the wrong text encoding — recreate it directly inside VS Code (not via a browser download) |

---

## 🔭 Possible Future Additions

- SMS alerts via Twilio
- Barcode scanning for faster item entry
- A "shopping list" that learns what you tend to run out of
- Production deployment (Render/Railway for the API, Vercel/Netlify for the frontend)

---

## 📄 License

This project was built for educational purposes.