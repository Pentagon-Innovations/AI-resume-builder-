// OpenAI Responses API Service
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  console.error('VITE_OPENAI_API_KEY environment variable is required');
}
const baseUrl = 'https://api.openai.com/v1/responses';
const defaultModel = 'gpt-5.2';

async function callOpenAIResponses(input, model = defaultModel, store = true) {
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        store,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.output_text || data.output || '';
  } catch (error) {
    console.error('OpenAI Responses API Error:', error);
    throw error;
  }
}

// Create a chat session-like interface for compatibility
export const AIChatSession = {
  async sendMessage(message) {
    try {
      const outputText = await callOpenAIResponses(message, defaultModel, true);
      
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
      console.error('Error sending message to OpenAI:', error);
      throw error;
    }
  },
};