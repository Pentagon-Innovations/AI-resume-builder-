# Vercel Setup Checklist

## Backend Environment Variables
- [ ] Add `OPENAI_API_KEY` = `[Your OpenAI API Key]`
  - Get your API key from the OpenAI dashboard
  - Required for all AI features
- [ ] (Optional) Remove `OPENROUTER_API_KEY` if not needed

## Frontend Environment Variables
- [ ] Add `VITE_OPENAI_API_KEY` = `[Your OpenAI API Key]`
  - Use the same API key as backend
  - Required for frontend AI features
- [ ] (Optional) Remove `VITE_GOOGLE_AI_API_KEY` if not needed

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
- The API key is hardcoded as fallback in code, but environment variables take precedence
- All AI calls now use OpenAI Responses API (`gpt-5.2` model)
- Old OpenRouter and Google AI calls have been replaced

