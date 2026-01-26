# Configure Vercel to Use main-clean as Production Branch

Since `main` branch has secrets in history and GitHub blocks it, configure Vercel to use `main-clean` as the production branch.

## Steps to Configure Production Branch in Vercel:

### For Backend Project (`resume-builder-backend`):

1. Go to: https://vercel.com/doney-pentagons-projects/resume-builder-backend/settings/git
2. Under **Production Branch**, change from `main` to `main-clean`
3. Click **Save**

### For Frontend Project (`resume-builder-frontend`):

1. Go to: https://vercel.com/doney-pentagons-projects/resume-builder-frontend/settings/git
2. Under **Production Branch**, change from `main` to `main-clean`
3. Click **Save**

## Alternative: Use Vercel CLI

You can also configure this via CLI, but the dashboard is easier.

## After Configuration:

- All pushes to `main-clean` will deploy to **Production**
- Other branches will deploy as **Preview** deployments
- Your production URLs will update automatically:
  - Backend: `https://resume-builder-backend-wheat.vercel.app`
  - Frontend: `https://resume-builder-frontend-seven-black.vercel.app`

## Current Status:

✅ Code is pushed to `main-clean` branch
✅ All fixes are in place
⏳ Waiting for Vercel production branch configuration

