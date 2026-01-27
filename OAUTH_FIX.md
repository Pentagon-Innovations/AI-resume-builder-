# Google OAuth Configuration Fix

## Issue
The request to `https://play.google.com/log?format=json&hasfast=true&authuser=0` indicates that Google OAuth is redirecting incorrectly, likely due to a mismatch between:
1. The redirect URI configured in Google Cloud Console
2. The actual backend URL being used

## Current Backend URL
Your actual backend URL: `https://resume-builder-backend-wheat.vercel.app`
Your frontend URL: `https://resume-builder-frontend-seven-black.vercel.app`

## Steps to Fix

### 1. Update Google Cloud Console Redirect URI

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID (the one you're using)
3. Under **Authorized redirect URIs**, make sure you have:
   ```
   https://resume-builder-backend-wheat.vercel.app/auth/google/callback
   ```
4. Also add for local development (if needed):
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Click **Save**

### 2. Update Vercel Environment Variables

1. Go to: https://vercel.com/doney-pentagons-projects/build-resume-backend/settings/environment-variables
2. Make sure these are set correctly:
   ```
   BACKEND_URL = https://resume-builder-backend-wheat.vercel.app
   FRONTEND_URL = https://resume-builder-frontend-seven-black.vercel.app
   GOOGLE_CLIENT_ID = [your-google-client-id]
   GOOGLE_CLIENT_SECRET = [your-google-client-secret]
   ```
3. ⚠️ **Important**: Select all environments (Production, Preview, Development)
4. Click **Save**

### 3. Redeploy Backend

After updating environment variables, redeploy:
```bash
cd build-resume-backend
vercel --prod
```

Or trigger a redeploy from Vercel dashboard:
1. Go to Deployments
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Verification

After fixing, test the OAuth flow:
1. Go to your frontend sign-in page
2. Click "Sign in with Google"
3. You should be redirected to Google's consent screen
4. After consent, you should be redirected back to: `https://resume-builder-backend-wheat.vercel.app/auth/google/callback`
5. Then redirected to your frontend with tokens

## Common Issues

### Issue: Still redirecting to play.google.com
- **Solution**: Double-check the redirect URI in Google Cloud Console matches exactly (no trailing slashes, correct protocol)

### Issue: "redirect_uri_mismatch" error
- **Solution**: The redirect URI in Google Cloud Console must match exactly what's being sent. Check the logs to see what URL is being used.

### Issue: CORS errors
- **Solution**: Make sure your frontend URL is in the CORS allowed origins in `main.ts`

## Debugging

To see what callback URL is being used, check the backend logs when OAuth is initiated. The GoogleStrategy logs:
```
🔐 Google OAuth Configuration:
  - Callback URL: [should show the exact URL]
```

Make sure this matches what's in Google Cloud Console!
