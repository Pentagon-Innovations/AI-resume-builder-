import GlobalApi from "./GlobalApi";

// Rerouted AI Service - Calls backend instead of direct AI providers
export const AIChatSession = {
  async sendMessage(message) {
    try {
      console.log('[AIChatSession] Sending request to backend...');
      const resp = await GlobalApi.GenerateAIContent(message);

      // The backend returns the raw text content
      const outputText = resp.data;

      // Parse JSON if the response is JSON (for compatibility with existing frontend logic)
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
      console.error('Error sending message to Backend AI Proxy:', error);
      throw error;
    }
  },
};