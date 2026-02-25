# ⬡ Yupiter Analytics Platform v2.0

Production-ready multi-user retail analytics platform with authentication, real-time CRUD, and persistent data.

## ✨ Key Features

- **Auth System**: Register/Login with localStorage persistence
- **Real Data**: All data manually entered and persisted — no mock/generated data
- **Full CRUD**: Create, Read, Update, Delete across all modules
- **Cyberpunk UI**: Neon pink-red aesthetic with 15+ CSS animations
- **11 Modules**: Dashboard, Stores, Costs, Productivity, Negative, P&L, Investment, New Store, Reports, Data, Admin

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🌐 Deploy to Vercel (Recommended)

```bash
# Option 1: Push to GitHub → import in vercel.com/new
# Option 2: CLI
npm i -g vercel
vercel --prod
```

## 🌐 Deploy to Netlify

```bash
# Option 1: Push to GitHub → import in app.netlify.com
# Option 2: CLI
npm i -g netlify-cli
npm run build
netlify deploy --dir=dist --prod
```

## 📁 Structure

```
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── netlify.toml
└── src/
    ├── main.jsx
    └── App.jsx      ← Full app (auth + 11 modules + animations)
```
