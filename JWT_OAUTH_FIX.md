# JWT Secret and OAuth Redirect Fix

## Issues Found

1. **JWT Secret Not Configured**: The `auth.service.ts` was using `process.env` directly instead of `ConfigService`, which doesn't work properly in NestJS
2. **OAuth Redirect Error**: The redirect URL was being constructed incorrectly in error cases

## Code Fixes Applied

✅ **Fixed `auth.service.ts`**:
- Added `ConfigService` injection
- Changed from `process.env.JWT_SECRET` to `this.configService.get<string>('JWT_SECRET')`
- This ensures environment variables are properly loaded

✅ **Fixed `auth.controller.ts`**:
- Improved error handling for OAuth redirects
- Added proper URL validation and formatting
- Ensures redirect URLs are properly constructed

## Required Vercel Environment Variables

You **MUST** add these environment variables in Vercel:

### Backend Environment Variables
Go to: https://vercel.com/doney-pentagons-projects/build-resume-backend/settings/environment-variables

Add/Verify these variables (select all environments: Production, Preview, Development):

```
JWT_SECRET = [Generate a random secret string - at least 32 characters]
JWT_REFRESH_SECRET = [Generate a different random secret string - at least 32 characters]
BACKEND_URL = https://resume-builder-backend-wheat.vercel.app
FRONTEND_URL = https://resume-builder-frontend-seven-black.vercel.app
GOOGLE_CLIENT_ID = [Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET = [Your Google OAuth Client Secret]
OPENAI_API_KEY = [Your OpenAI API Key]
OPENROUTER_API_KEY = [Your OpenRouter API key]
MONGODB_URI = [Your MongoDB connection string]
```

### Generate JWT Secrets

You can generate secure random secrets using:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online Generator**
- Go to: https://generate-secret.vercel.app/32
- Generate two different secrets (one for JWT_SECRET, one for JWT_REFRESH_SECRET)

## Steps to Fix

1. **Generate JWT Secrets** (see above)
2. **Add Environment Variables in Vercel**:
   - Go to backend project settings
   - Add `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - Verify all other required variables are set
   - **Important**: Select all environments (Production, Preview, Development)
3. **Redeploy Backend**:
   ```bash
   cd build-resume-backend
   vercel --prod
   ```
   Or trigger redeploy from Vercel dashboard
4. **Verify Google OAuth Redirect URI**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Add redirect URI: `https://resume-builder-backend-wheat.vercel.app/auth/google/callback`

## Testing

After fixing, test the OAuth flow:
1. Go to: `https://resume-builder-frontend-seven-black.vercel.app/auth/sign-in`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect back to frontend with tokens

## Common Errors

### "JWT secret not configured"
- **Cause**: `JWT_SECRET` or `JWT_REFRESH_SECRET` not set in Vercel
- **Fix**: Add both secrets in Vercel environment variables and redeploy

### "redirect_uri_mismatch"
- **Cause**: Redirect URI in Google Cloud Console doesn't match backend URL
- **Fix**: Add exact URL: `https://resume-builder-backend-wheat.vercel.app/auth/google/callback`

### "Cannot GET /auth/google/..."
- **Cause**: Malformed redirect URL (now fixed in code)
- **Fix**: Redeploy with updated code
