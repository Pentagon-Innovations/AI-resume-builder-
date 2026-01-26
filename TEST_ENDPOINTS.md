# OpenAI API Test Endpoints

## Backend Endpoints

### Test OpenAI API
- **URL**: `GET /test/openai`
- **Description**: Tests the OpenAI Responses API connection
- **Response**: 
  ```json
  {
    "success": true,
    "message": "OpenAI API is working!",
    "response": "...",
    "timestamp": "2026-01-25T..."
  }
  ```

### Health Check
- **URL**: `GET /test/health`
- **Description**: Simple health check endpoint
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "Resume Builder Backend",
    "timestamp": "2026-01-25T..."
  }
  ```

## Frontend Test Page

- **URL**: `/test/openai`
- **Description**: UI page to test OpenAI API
- **Features**:
  - Test button to call the API
  - Success/error display
  - Shows API response
  - Displays environment variable info

## Testing Steps

1. **After deployment, test backend directly:**
   ```
   https://resume-builder-backend-gold.vercel.app/test/openai
   ```

2. **Test health endpoint:**
   ```
   https://resume-builder-backend-gold.vercel.app/test/health
   ```

3. **Test from frontend:**
   ```
   https://resume-builder-frontend-teal.vercel.app/test/openai
   ```

## Troubleshooting

### If you get 404:
- Wait for Vercel deployment to complete
- Check that TestModule is imported in AppModule
- Verify the route is `/test/openai` (not `/test/openai/`)

### If you get "Failed to fetch":
- Check CORS configuration in `main.ts`
- Verify `VITE_API_BASE_URL` is set correctly
- Check browser console for detailed error

### If API test fails:
- Verify `OPENAI_API_KEY` is set in Vercel backend environment variables
- Check Vercel logs for detailed error messages
- Ensure the API key is valid

