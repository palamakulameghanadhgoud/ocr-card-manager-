# Deployment Guide

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/palamakulameghanadhgoud/ocr-card-manager-.git
git push -u origin main
```

## 2. Deploy Backend (Railway or Render)

The backend needs MongoDB and file storage. Deploy to **Railway** or **Render**:

### Railway

1. Go to [railway.app](https://railway.app) and sign in
2. New Project → Deploy from GitHub → select your repo
3. Set **Root Directory** to `server`
4. Add env vars:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `NODE_ENV` = production
5. Deploy → copy the public URL (e.g. `https://your-app.railway.app`)

### Render

1. Go to [render.com](https://render.com) and sign in
2. New → Web Service → connect your repo
3. **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node src/index.js`
6. Add env: `MONGODB_URI`, `NODE_ENV=production`
7. Deploy → copy the URL

## 3. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Import your GitHub repo
3. Vercel will auto-detect the config from `vercel.json`
4. Add **Environment Variable**:
   - `VITE_API_URL` = your backend URL (e.g. `https://your-app.railway.app`)
5. Deploy

The frontend will call your backend URL for all API requests.

## 4. CORS

Ensure your backend allows the Vercel domain. In `server/src/index.js`, CORS is enabled for all origins. For production you may want to restrict:

```js
app.use(cors({ origin: ['https://your-app.vercel.app'] }));
```
