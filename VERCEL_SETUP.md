# Vercel Deployment Setup - Quick Fix Guide

## Common "Page Not Found" Issues

### Issue 1: Root Directory Setting

**Problem**: Vercel project has Root Directory set to `frontend` instead of root.

**Solution**:

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Under "Root Directory", make sure it's set to **`.` (root)** or **leave it empty**
3. Do NOT set it to `frontend`
4. Redeploy

### Issue 2: Build Output Not Found

**Problem**: Vercel can't find the built frontend files.

**Solution**: The `vercel.json` is already configured correctly with:

- `outputDirectory: "frontend/dist"`
- `buildCommand: "cd frontend && npm ci && npm run build"`

Make sure these paths are correct in your Vercel project settings.

### Issue 3: API Functions Not Detected

**Problem**: API routes return 404.

**Solution**:

- Vercel automatically detects the `api/` directory at the root
- Make sure `api/` folder is at the repository root (same level as `frontend/` and `backend/`)
- The `api/package.json` should have `@vercel/node` as a dependency (already included)

### Issue 4: TypeScript Compilation Errors

**Problem**: API functions fail to compile.

**Solution**:

- Vercel will compile TypeScript automatically
- Make sure `api/tsconfig.json` exists (already created)
- Check build logs in Vercel dashboard for specific errors

## Correct Vercel Project Settings

When setting up the project in Vercel Dashboard:

1. **Framework Preset**: Vite (or "Other")
2. **Root Directory**: `.` (root) - **IMPORTANT!**
3. **Build Command**: `cd frontend && npm ci && npm run build` (or leave auto-detected)
4. **Output Directory**: `frontend/dist` (or leave auto-detected)
5. **Install Command**: `cd frontend && npm ci` (or leave auto-detected)

## Environment Variables

Make sure these are set in Vercel (Project Settings → Environment Variables):

```
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=urlshortener
HASH_ID_SALT=your-secret-salt
NODE_ENV=production
VITE_API_URL=https://your-project.vercel.app
VITE_ALLOWED_ORIGIN=https://your-project.vercel.app
```

## Testing After Deployment

1. **Frontend**: Visit `https://your-project.vercel.app` - should show the URL shortener form
2. **API Health**: Visit `https://your-project.vercel.app/api/health` - should return JSON
3. **Short Code**: Create a short URL and test the redirect

## File Structure

Your repository should look like this:

```
url-shortner/
├── api/              ← Serverless functions (Vercel auto-detects this)
│   ├── [shortCode].ts
│   ├── shorten.ts
│   ├── health.ts
│   ├── lib/
│   └── package.json
├── frontend/         ← Frontend React app
│   ├── src/
│   ├── dist/         ← Build output (created during build)
│   └── package.json
├── backend/          ← Original Express backend (not used in Vercel deployment)
├── vercel.json       ← Vercel configuration
└── README.md
```

## If Still Not Working

1. Check Vercel build logs for errors
2. Verify the Root Directory is set to `.` (root)
3. Make sure `api/` directory exists at root level
4. Check that environment variables are set correctly
5. Try redeploying after fixing settings
