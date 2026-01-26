# Vercel Setup Checklist

## Backend Environment Variables
- [ ] Add `OPENROUTER_API_KEY` = `[Your OpenRouter API Key]`
  - Required for all AI features (resume analysis, improvement, etc.)
  - Get your API key from https://openrouter.ai/
- [ ] (Optional) Remove `OPENAI_API_KEY` if not needed

## Frontend Environment Variables
- [ ] Add `VITE_OPENROUTER_API_KEY` = `[Your OpenRouter API Key]`
  - Required for frontend AI features (AI-generated summaries, bullet points)
  - Use the same API key as backend
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

