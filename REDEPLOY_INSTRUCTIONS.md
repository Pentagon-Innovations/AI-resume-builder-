# Complete Vercel Redeploy Guide

## 🗑️ Step 1: Delete Existing Projects

### Delete Backend Project
1. Go to: https://vercel.com/dashboard
2. Find: `resume-builder-backend` (or your backend project name)
3. Click the project → **Settings** → Scroll down → **Delete Project**
4. Type project name to confirm → **Delete**

### Delete Frontend Project
1. In Vercel dashboard, find: `resume-builder-frontend` (or your frontend project name)
2. Click the project → **Settings** → Scroll down → **Delete Project**
3. Type project name to confirm → **Delete**

---

## 🚀 Step 2: Redeploy Backend

1. **Go to**: https://vercel.com/new
2. **Import Git Repository**: Select `Pentagon-Innovations/AI-resume-builder-`
3. **Configure Project**:
   ```
   Project Name: resume-builder-backend
   Root Directory: build-resume-backend
   Framework Preset: Other
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables** (Click "Environment Variables"):
   ```
   OPENROUTER_API_KEY = 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
   MONGODB_URI = [Your MongoDB URI]
   JWT_SECRET = [Your JWT Secret]
   JWT_REFRESH_SECRET = [Your JWT Refresh Secret]
   BACKEND_URL = [Will be set after deployment]
   FRONTEND_URL = [Will be set after deployment]
   GOOGLE_CLIENT_ID = [Your Google OAuth Client ID]
   GOOGLE_CLIENT_SECRET = [Your Google OAuth Client Secret]
   ```
   ⚠️ **Important**: Select all environments (Production, Preview, Development)

5. Click **Deploy**
6. **Wait for deployment** and note your backend URL (e.g., `https://resume-builder-backend-xxx.vercel.app`)

---

## 🎨 Step 3: Redeploy Frontend

1. **Go to**: https://vercel.com/new
2. **Import Git Repository**: Select `Pentagon-Innovations/AI-resume-builder-`
3. **Configure Project**:
   ```
   Project Name: resume-builder-frontend
   Root Directory: AI-Resume-Builder
   Framework Preset: Vite (should auto-detect)
   Build Command: npm run build (should auto-detect)
   Output Directory: dist (should auto-detect)
   Install Command: npm install
   ```

4. **Add Environment Variables**:
   ```
   VITE_OPENROUTER_API_KEY = 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
   VITE_API_BASE_URL = [Your backend URL from Step 2]
   VITE_FRONTEND_URL = [Will be set after deployment]
   ```
   ⚠️ **Important**: Select all environments (Production, Preview, Development)

5. Click **Deploy**
6. **Wait for deployment** and note your frontend URL (e.g., `https://resume-builder-frontend-xxx.vercel.app`)

---

## 🔄 Step 4: Update Environment Variables with Actual URLs

### Update Backend Environment Variables:
1. Go to backend project → **Settings** → **Environment Variables**
2. Update:
   ```
   BACKEND_URL = https://[your-actual-backend-url].vercel.app
   FRONTEND_URL = https://[your-actual-frontend-url].vercel.app
   ```
3. Click **Save**
4. Go to **Deployments** → Click **Redeploy** on latest deployment

### Update Frontend Environment Variables:
1. Go to frontend project → **Settings** → **Environment Variables**
2. Update:
   ```
   VITE_API_BASE_URL = https://[your-actual-backend-url].vercel.app
   VITE_FRONTEND_URL = https://[your-actual-frontend-url].vercel.app
   ```
3. Click **Save**
4. Go to **Deployments** → Click **Redeploy** on latest deployment

---

## 🔐 Step 5: Update Google OAuth Settings

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://[your-new-backend-url]/auth/google/callback
   ```
4. Click **Save**

---

## ✅ Step 6: Verify Everything Works

### Test Backend:
- Health: `https://[backend-url]/test/health`
- OpenAI Test: `https://[backend-url]/test/openai`

### Test Frontend:
- Test Page: `https://[frontend-url]/test/openai`
- Sign In: `https://[frontend-url]/auth/sign-in`

### Test Features:
- [ ] Resume analysis works
- [ ] LinkedIn JD extraction works
- [ ] AI-generated summaries work
- [ ] Google OAuth login works

---

## 📝 Quick Reference

### Backend Environment Variables:
- `OPENROUTER_API_KEY` ✅
- `MONGODB_URI` ✅
- `JWT_SECRET` ✅
- `JWT_REFRESH_SECRET` ✅
- `BACKEND_URL` ✅ (set after deployment)
- `FRONTEND_URL` ✅ (set after deployment)
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅

### Frontend Environment Variables:
- `VITE_OPENROUTER_API_KEY` ✅
- `VITE_API_BASE_URL` ✅ (set after deployment)
- `VITE_FRONTEND_URL` ✅ (set after deployment)

---

## 🆘 Troubleshooting

**Build Fails?**
- Check build logs in Vercel dashboard
- Verify `Root Directory` is set correctly
- Check `package.json` scripts

**Environment Variables Not Working?**
- Make sure they're set for all environments (Production, Preview, Development)
- Redeploy after adding variables

**CORS Errors?**
- Verify `FRONTEND_URL` and `BACKEND_URL` match actual URLs
- Check for trailing slashes (remove them)

**API Errors?**
- Verify `OPENROUTER_API_KEY` is set correctly
- Check Vercel logs for detailed error messages

