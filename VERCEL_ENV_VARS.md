# Vercel Environment Variables - Quick Reference

## 🎯 Your Project URLs

- **Backend**: `https://resume-builder-backend-wheat.vercel.app`
- **Frontend**: `https://resume-builder-frontend-seven-black.vercel.app`

---

## 🔧 Backend Environment Variables

Add these in: **Vercel Dashboard** → **Backend Project** → **Settings** → **Environment Variables**

```
OPENROUTER_API_KEY = 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

MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resumeDB?retryWrites=true&w=majority
(Replace with your MongoDB connection string - see MONGODB_SETUP.md)

JWT_SECRET = 4ad097fe2ded424b84d1de9b16e30ef4b28b4e0ee605fba324ee7555b83b8631

JWT_REFRESH_SECRET = af0aa5ca3b2a58451c42511daa16cb31c677cf4be1c3e0ee69453ad7161bea9f

BACKEND_URL = https://resume-builder-backend-wheat.vercel.app

FRONTEND_URL = https://resume-builder-frontend-seven-black.vercel.app

GOOGLE_CLIENT_ID = [Your Google OAuth Client ID]

GOOGLE_CLIENT_SECRET = [Your Google OAuth Client Secret]
```

⚠️ **Important**: Select **Production**, **Preview**, and **Development** for all variables!

---

## 🎨 Frontend Environment Variables

Add these in: **Vercel Dashboard** → **Frontend Project** → **Settings** → **Environment Variables**

```
VITE_OPENROUTER_API_KEY = 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

VITE_API_BASE_URL = https://resume-builder-backend-wheat.vercel.app

VITE_FRONTEND_URL = https://resume-builder-frontend-seven-black.vercel.app
```

⚠️ **Important**: Select **Production**, **Preview**, and **Development** for all variables!

---

## 🔐 Google OAuth Configuration

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://resume-builder-backend-wheat.vercel.app/auth/google/callback
   ```
4. Click **Save**

---

## 📝 MongoDB Setup

See `MONGODB_SETUP.md` for detailed instructions on creating a new MongoDB Atlas database.

**Quick Steps:**
1. Create account at https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster
3. Create database user
4. Allow network access (0.0.0.0/0 for Vercel)
5. Get connection string
6. Add to backend environment variables as `MONGODB_URI`

---

## ✅ Testing Checklist

After setting up environment variables and redeploying:

- [ ] Backend Health: https://resume-builder-backend-wheat.vercel.app/test/health
- [ ] Backend AI Test: https://resume-builder-backend-wheat.vercel.app/test/openai
- [ ] Frontend Test: https://resume-builder-frontend-seven-black.vercel.app/test/openai
- [ ] Google OAuth login works
- [ ] Resume analysis works
- [ ] LinkedIn JD extraction works

---

## 🚨 Common Issues

**Environment variables not working?**
- Make sure they're set for all environments (Production, Preview, Development)
- Redeploy after adding/updating variables

**CORS errors?**
- Verify `FRONTEND_URL` and `BACKEND_URL` match exactly (no trailing slashes)
- Check backend logs for CORS configuration

**MongoDB connection fails?**
- Verify `MONGODB_URI` is correct
- Check Network Access in MongoDB Atlas (should allow 0.0.0.0/0)
- Verify database user credentials

