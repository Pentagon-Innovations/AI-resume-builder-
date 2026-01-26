# Vercel Setup Checklist

## Backend Environment Variables
- [ ] Add `OPENROUTER_API_KEY` = `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`
  - Required for all AI features (resume analysis, improvement, etc.)
- [ ] (Optional) Remove `OPENAI_API_KEY` if not needed

## Frontend Environment Variables
- [ ] Add `VITE_OPENROUTER_API_KEY` = `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`
  - Required for frontend AI features (AI-generated summaries, bullet points)
- [ ] (Optional) Remove `VITE_OPENAI_API_KEY` and `VITE_GOOGLE_AI_API_KEY` if not needed

## Deployment Steps
1. Push code changes to Git repository
2. Vercel will auto-deploy, OR manually trigger redeploy
3. Check build logs for any errors
4. Test AI features after deployment

## Testing Checklist
- [ ] Resume analysis endpoint works
- [ ] Resume improvement endpoint works
- [ ] AI-generated summaries work (frontend)
- [ ] AI-generated bullet points work (frontend)

## Important Notes
- All AI calls now use OpenRouter API (`openai/gpt-4o` model)
- The API key must be set in Vercel environment variables
- Backend uses `OPENROUTER_API_KEY`
- Frontend uses `VITE_OPENROUTER_API_KEY`

