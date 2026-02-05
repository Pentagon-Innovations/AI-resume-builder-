# How to Add JWT_SECRET and JWT_REFRESH_SECRET to Vercel

## Step 1: Generate JWT Secrets

You need to generate two different random secret strings (at least 32 characters each). Here are several methods:

### Method 1: Using Node.js (Recommended)
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET (run again to get a different value)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: Using PowerShell (Windows)
```powershell
# Generate JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate JWT_REFRESH_SECRET (run again)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Method 3: Using OpenSSL (if installed)
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET (run again)
openssl rand -hex 32
```

### Method 4: Online Generator
1. Go to: https://generate-secret.vercel.app/32
2. Click "Generate" twice to get two different secrets
3. Copy each secret

### Method 5: Quick Node.js Script
Create a file `generate-secrets.js`:
```javascript
const crypto = require('crypto');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));
```

Then run:
```bash
node generate-secrets.js
```

**Example Output:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1
```

---

## Step 2: Add Secrets to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to your backend project**:
   - Visit: https://vercel.com/doney-pentagons-projects/build-resume-backend/settings/environment-variables
   - Or navigate: Dashboard → `build-resume-backend` → Settings → Environment Variables

2. **Add JWT_SECRET**:
   - Click **"Add New"** button
   - **Key**: `JWT_SECRET`
   - **Value**: Paste your generated JWT_SECRET (the first one)
   - **Environments**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

3. **Add JWT_REFRESH_SECRET**:
   - Click **"Add New"** button again
   - **Key**: `JWT_REFRESH_SECRET`
   - **Value**: Paste your generated JWT_REFRESH_SECRET (the second one, different from JWT_SECRET)
   - **Environments**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

4. **Verify**:
   - You should see both variables listed:
     - `JWT_SECRET` (with all environments checked)
     - `JWT_REFRESH_SECRET` (with all environments checked)

### Option B: Via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project** (if not already linked):
   ```bash
   cd build-resume-backend
   vercel link
   ```

4. **Add environment variables**:
   ```bash
   # Add JWT_SECRET
   vercel env add JWT_SECRET production preview development
   # When prompted, paste your JWT_SECRET value
   
   # Add JWT_REFRESH_SECRET
   vercel env add JWT_REFRESH_SECRET production preview development
   # When prompted, paste your JWT_REFRESH_SECRET value
   ```

---

## Step 3: Redeploy Backend

After adding the environment variables, you need to redeploy:

### Via Vercel Dashboard:
1. Go to: https://vercel.com/doney-pentagons-projects/build-resume-backend/deployments
2. Click the three dots (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Via Vercel CLI:
```bash
cd build-resume-backend
vercel --prod
```

---

## Step 4: Verify It Works

1. **Check logs** (should NOT see JWT warnings):
   - Go to: https://vercel.com/doney-pentagons-projects/build-resume-backend/deployments
   - Click on the latest deployment
   - Check "Runtime Logs"
   - You should NOT see: `⚠️ WARNING: JWT_SECRET not configured`

2. **Test OAuth**:
   - Go to: `https://resume-builder-frontend-seven-black.vercel.app/auth/sign-in`
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect successfully with tokens

---

## Quick Reference: All Required Environment Variables

Make sure you have ALL these in Vercel:

```
✅ JWT_SECRET = [your-generated-secret-1]
✅ JWT_REFRESH_SECRET = [your-generated-secret-2]
✅ BACKEND_URL = https://resume-builder-backend-wheat.vercel.app
✅ FRONTEND_URL = https://resume-builder-frontend-seven-black.vercel.app
✅ GOOGLE_CLIENT_ID = [your-google-client-id]
✅ GOOGLE_CLIENT_SECRET = [your-google-client-secret]
✅ OPENAI_API_KEY = [Your OpenAI API Key]
✅ OPENROUTER_API_KEY = [your-openrouter-key]
✅ MONGODB_URI = [your-mongodb-connection-string]
```

---

## Troubleshooting

### "Environment variable not found"
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding variables

### "Still seeing JWT warnings"
- Verify variables are set in Vercel dashboard
- Check that you redeployed after adding them
- Check deployment logs to confirm variables are loaded

### "OAuth still not working"
- Verify `BACKEND_URL` and `FRONTEND_URL` are correct
- Check Google OAuth redirect URI matches: `https://resume-builder-backend-wheat.vercel.app/auth/google/callback`
- Check Vercel deployment logs for errors

---

## Security Notes

⚠️ **Important**:
- Never commit JWT secrets to Git
- Use different secrets for production and development
- Keep secrets secure and rotate them periodically
- The default secrets in code are NOT secure for production
