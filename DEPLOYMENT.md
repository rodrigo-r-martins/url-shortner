# Deployment Guide for URL Shortener

This guide provides two deployment options:

1. **Deploy Everything on Vercel** (Recommended) - Frontend + Backend as serverless functions
2. **Deploy Frontend on Vercel, Backend Separately** - Traditional approach

## Option 1: Deploy Everything on Vercel (Recommended)

Deploy both frontend and backend to Vercel using serverless functions. This is the simplest approach for a monorepo.

### Architecture

- **Frontend**: React + Vite application → Vercel static hosting
- **Backend**: Express.js routes converted to Vercel serverless functions → Vercel API routes
- **Database**: MongoDB Atlas (external service, free tier available)

### Prerequisites

1. Vercel account (free tier available)
2. MongoDB Atlas account (free tier available)
3. GitHub repository (for automatic deployments)

### Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (free tier M0)
3. Create a database user with read/write permissions
4. Whitelist IP addresses:
   - For development: Add your local IP
   - For production: Add `0.0.0.0/0` to allow all IPs (Vercel serverless functions have dynamic IPs)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Add `/urlshortener` (or your database name) to the connection string

### Step 2: Deploy to Vercel

#### Method A: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:

   - **Framework Preset**: Vite (or "Other")
   - **Root Directory**: Leave as root (`.`)
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm ci` (Vercel will also install API dependencies automatically)

5. Add Environment Variables (Project Settings → Environment Variables):

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urlshortener
   DATABASE_NAME=urlshortener
   HASH_ID_SALT=your-secret-salt-here-change-this
   BASE_URL=https://your-project.vercel.app (will be set automatically)
   FRONTEND_URL=https://your-project.vercel.app (will be set automatically)
   NODE_ENV=production
   ```

   > **Note**: `VERCEL_URL` is automatically provided by Vercel, so `BASE_URL` and `FRONTEND_URL` can use it.

6. Click "Deploy"

#### Method B: Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Login:

   ```bash
   vercel login
   ```

3. Deploy:

   ```bash
   cd /path/to/url-shortner
   vercel
   ```

4. Set environment variables:

   ```bash
   vercel env add MONGODB_URI production
   vercel env add DATABASE_NAME production
   vercel env add HASH_ID_SALT production
   vercel env add NODE_ENV production
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Step 3: Update Frontend API URL

After deployment, update the frontend to use the Vercel API:

1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add for **Production**:
   ```
   VITE_API_URL=https://your-project.vercel.app
   VITE_ALLOWED_ORIGIN=https://your-project.vercel.app
   ```
3. Redeploy (or push to trigger auto-deploy)

### API Endpoints

After deployment, your API will be available at:

- `POST /api/shorten` - Create a short URL
- `GET /:shortCode` - Redirect to long URL
- `GET /api/health` - Health check
- `GET /api/db/health` - Database health check
- `GET /api/cors-debug` - CORS debugging

### How It Works

- The `api/` directory contains serverless functions that Vercel automatically deploys
- Each file in `api/` becomes an API route
- `api/[shortCode].ts` handles dynamic routes like `/:shortCode`
- The `vercel.json` file configures routing and rewrites
- Frontend is served from `frontend/dist` as static files

### Troubleshooting

**API functions not found:**

- Ensure `api/` directory is at the root of your project
- Check that `api/package.json` includes `@vercel/node`

**Database connection errors:**

- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access allows all IPs (`0.0.0.0/0`)
- Ensure database name is included in connection string

**CORS errors:**

- Verify `FRONTEND_URL` matches your Vercel deployment URL
- Check that `VITE_API_URL` in frontend matches your Vercel URL

---

## Option 2: Deploy Frontend on Vercel, Backend Separately

This is the traditional approach if you prefer to keep the Express backend as-is.

### Architecture

- **Frontend**: React + Vite application → Deploy to Vercel
- **Backend**: Express.js + MongoDB → Deploy to Railway, Render, or Fly.io

## Prerequisites

1. Vercel account (free tier available)
2. MongoDB Atlas account (free tier available) or another MongoDB hosting service
3. Backend hosting service (Railway, Render, or Fly.io)

## Step 1: Deploy Backend

### Option A: Railway (Recommended)

1. Go to [Railway](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the backend folder. If not:
   - Set **Root Directory** to `backend`
   - Set **Build Command** to `npm run build`
   - Set **Start Command** to `npm start`
5. Add environment variables in Railway:
   ```
   PORT=8080
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   DATABASE_NAME=urlshortener
   BASE_URL=https://your-backend-url.railway.app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   HASH_ID_SALT=your-secret-salt-here
   ```
6. Railway will provide a URL like `https://your-app.railway.app`
7. Copy this URL - you'll need it for the frontend

### Option B: Render

1. Go to [Render](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: url-shortener-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add the same environment variables as above
6. Render will provide a URL like `https://your-app.onrender.com`

### Option C: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In the `backend` folder, create `fly.toml` (Fly.io will help generate this)
3. Run `fly launch` in the backend directory
4. Set environment variables using `fly secrets set KEY=value`
5. Deploy with `fly deploy`

## Step 2: Deploy Frontend to Vercel

### Method 1: Vercel Dashboard (Recommended for Monorepos)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:

   - **Framework Preset**: Vite (or leave as "Other")
   - **Root Directory**: Click "Edit" → Set to `frontend` ⚠️ **Important for monorepos!**
   - **Build Command**: `npm run build` (auto-detected, or leave default)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

   > **Note**: The `vercel.json` at the root will be used, but you still need to set Root Directory to `frontend` in the dashboard.

5. Add Environment Variables:

   - Go to Project Settings → Environment Variables
   - Add for **Production** (and optionally Preview/Development):
     - `VITE_API_URL` = `https://your-backend-url.railway.app`
     - `VITE_ALLOWED_ORIGIN` = `https://your-frontend-url.vercel.app` (you'll get this after first deploy)

6. Click "Deploy"
7. After first deployment, copy your Vercel URL and update:
   - `VITE_ALLOWED_ORIGIN` in Vercel
   - `FRONTEND_URL` in your backend service

### Method 2: Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Navigate to project root and deploy:

   ```bash
   cd /path/to/url-shortner
   vercel
   ```

4. Follow the prompts:

   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (first time)
   - Project name: `url-shortener` (or your choice)
   - In your project settings, set **Root Directory** to `frontend`

5. Set environment variables via CLI:

   ```bash
   vercel env add VITE_API_URL production
   # Enter your backend URL: https://your-backend-url.railway.app

   vercel env add VITE_ALLOWED_ORIGIN production
   # Enter your frontend URL (after first deploy): https://your-frontend-url.vercel.app
   ```

6. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

## Step 3: Update Backend CORS Settings

After deploying the frontend, update your backend environment variables to include the production frontend URL:

1. In your backend hosting service (Railway/Render/Fly.io), update:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
2. Restart/redeploy the backend service

## Step 4: Update MongoDB Connection

1. If using MongoDB Atlas:
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` to allow all IPs (or specific IPs for better security)
   - Update your `MONGODB_URI` in backend environment variables

## Environment Variables Summary

### Frontend (Vercel)

- `VITE_API_URL`: Backend API URL (e.g., `https://your-backend.railway.app`)
- `VITE_ALLOWED_ORIGIN`: Frontend URL (e.g., `https://your-frontend.vercel.app`)

### Backend (Railway/Render/Fly.io)

- `PORT`: Server port (usually `8080` or auto-assigned)
- `NODE_ENV`: `production`
- `MONGODB_URI`: MongoDB connection string
- `DATABASE_NAME`: Database name (e.g., `urlshortener`)
- `BASE_URL`: Backend URL (e.g., `https://your-backend.railway.app`)
- `FRONTEND_URL`: Frontend URL (e.g., `https://your-frontend.vercel.app`)
- `HASH_ID_SALT`: Secret salt for hash generation

## Testing the Deployment

1. Visit your Vercel frontend URL
2. Try shortening a URL
3. Check that the short URL redirects correctly
4. Verify backend logs for any errors

## Troubleshooting

### Frontend can't connect to backend

- Check `VITE_API_URL` is set correctly in Vercel
- Verify backend is running and accessible
- Check CORS settings in backend

### CORS errors

- Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
- Check backend CORS configuration allows your frontend origin

### MongoDB connection issues

- Verify MongoDB Atlas network access allows your backend IP
- Check `MONGODB_URI` is correct and includes database name
- Ensure MongoDB credentials are correct

## Continuous Deployment

Both Vercel and Railway/Render support automatic deployments:

- Push to `main` branch → Auto-deploy
- Pull requests → Preview deployments (Vercel)

## Cost Estimate

- **Vercel**: Free tier (generous limits)
- **Railway**: $5/month (after free trial) or free with Railway Hobby
- **Render**: Free tier available (with limitations)
- **MongoDB Atlas**: Free tier (512MB storage)

## Alternative: Convert Backend to Vercel Serverless Functions

If you want everything on Vercel, you can convert the Express backend to Vercel serverless functions. This requires refactoring the code structure. Let me know if you'd like help with this approach.
