// OpenRouter API Service
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('VITE_OPENROUTER_API_KEY environment variable is required');
}
const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
const defaultModel = 'openai/gpt-4o';
const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://resume-builder-frontend-teal.vercel.app';

async function callOpenRouter(input, model = defaultModel) {
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': frontendUrl,
        'X-Title': 'ResumeAlign',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }
    return content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

// Create a chat session-like interface for compatibility
export const AIChatSession = {
  async sendMessage(message) {
    try {
      const outputText = await callOpenRouter(message, defaultModel);
      
      // Parse JSON if the response is JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(outputText);
      } catch {
        parsedResponse = outputText;
      }

      return {
        response: {
          text: () => typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse),
        },
      };
    } catch (error) {
      console.error('Error sending message to OpenRouter:', error);
      throw error;
    }
  },
};