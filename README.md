# 🚀 Antigravity - Deployment Guide

Follow these steps to deploy your real-time collaboration platform.

## 1. Backend Deployment (e.g., [Render](https://render.com) or [Railway](https://railway.app))

- **Repository**: Connect your GitHub repo.
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Environment Variables**:
  - `MONGO_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://...`)
  - `CLIENT_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)

## 2. Frontend Deployment (e.g., [Vercel](https://vercel.com) or [Netlify](https://netlify.com))

- **Repository**: Connect your GitHub repo.
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your backend URL (e.g., `https://your-server.onrender.com`)

## 3. Local Development (Optional)

1. Create a `.env` file in the `server` folder with your `MONGO_URI`.
2. Create a `.env` file in the `client` folder with `VITE_API_URL=http://localhost:5000`.
3. Run `npm install` in both folders.
4. Run `npm run dev` in `client` and `node index.js` in `server`.

## Features
- ✅ Real-time Code Editor with User Cursors
- ✅ Smart Whiteboard with Floating Controls
- ✅ Video & Audio Calling (Peer-to-Peer)
- ✅ WhatsApp Invitation Integration
- ✅ Mobile-Responsive Layout
"# collobrative-platform" 
