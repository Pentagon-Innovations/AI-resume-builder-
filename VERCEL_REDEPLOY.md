# Vercel Redeploy from Scratch Guide

## Step 1: Delete Existing Vercel Projects

### Backend Project (`resume-builder-backend`)
1. Go to: https://vercel.com/dashboard
2. Find your backend project (`resume-builder-backend` or similar)
3. Click on the project
4. Go to **Settings** → Scroll to bottom → **Delete Project**
5. Type the project name to confirm
6. Click **Delete**

### Frontend Project (`resume-builder-frontend`)
1. In Vercel dashboard, find your frontend project
2. Click on the project
3. Go to **Settings** → Scroll to bottom → **Delete Project**
4. Type the project name to confirm
5. Click **Delete**

## Step 2: Redeploy Backend

1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Select your repository: `Pentagon-Innovations/AI-resume-builder-`
4. **Configure Project:**
   - **Project Name**: `resume-builder-backend` (or your preferred name)
   - **Root Directory**: `build-resume-backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables** (Add these):
   ```
   OPENROUTER_API_KEY = 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
   MONGODB_URI = [Your MongoDB URI]
   JWT_SECRET = [Your JWT Secret]
   JWT_REFRESH_SECRET = [Your JWT Refresh Secret]
   BACKEND_URL = https://[your-backend-project].vercel.app
   FRONTEND_URL = https://[your-frontend-project].vercel.app
   GOOGLE_CLIENT_ID = [Your Google OAuth Client ID]
   GOOGLE_CLIENT_SECRET = [Your Google OAuth Client Secret]
   ```

6. Click **Deploy**

## Step 3: Redeploy Frontend

1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Select your repository: `Pentagon-Innovations/AI-resume-builder-`
4. **Configure Project:**
   - **Project Name**: `resume-builder-frontend` (or your preferred name)
   - **Root Directory**: `AI-Resume-Builder`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install`

5. **Environment Variables** (Add these):
   ```
   VITE_OPENROUTER_API_KEY = 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
   VITE_API_BASE_URL = https://[your-backend-project].vercel.app
   VITE_FRONTEND_URL = https://[your-frontend-project].vercel.app
   ```

6. Click **Deploy**

## Step 4: Update Environment Variables After Deployment

After both projects are deployed, you'll get new URLs. Update:

### Backend:
- `BACKEND_URL` = Your new backend URL
- `FRONTEND_URL` = Your new frontend URL

### Frontend:
- `VITE_API_BASE_URL` = Your new backend URL
- `VITE_FRONTEND_URL` = Your new frontend URL

Then **Redeploy** both projects (or they'll auto-redeploy if connected to Git).

## Step 5: Update Google OAuth Settings

1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client
3. Add your new backend callback URL:
   ```
   https://[your-new-backend-url]/auth/google/callback
   ```
4. Save

## Step 6: Verify Deployment

1. **Backend Health Check:**
   ```
   https://[your-backend-url]/test/health
   ```

2. **Backend OpenAI Test:**
   ```
   https://[your-backend-url]/test/openai
   ```

3. **Frontend Test Page:**
   ```
   https://[your-frontend-url]/test/openai
   ```

## Troubleshooting

- **Build Fails**: Check build logs in Vercel dashboard
- **Environment Variables Not Working**: Make sure they're set for Production, Preview, and Development
- **CORS Errors**: Verify `FRONTEND_URL` and `BACKEND_URL` are set correctly
- **API Errors**: Check that `OPENROUTER_API_KEY` is set in both projects

