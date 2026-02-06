import GlobalApi from "./GlobalApi";

// Rerouted AI Service - Calls backend instead of direct AI providers
export const AIChatSession = {
  async sendMessage(message) {
    try {
      console.log('[AIChatSession] Sending request to backend...');
      const resp = await GlobalApi.GenerateAIContent(message);

      // The backend returns the raw text content
      let outputText = resp.data;

      const extractJson = (text) => {
        if (!text) return text;

        // 1. Try to find content within backticks
        const codeBlockMatch = text.match(/```(?:json|html)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();

        // 2. Find the first '{' or '[' and matching last brace/bracket
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');

        let start = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
        else if (firstBracket !== -1) start = firstBracket;

        let end = -1;
        if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) end = lastBrace;
        else if (lastBracket !== -1) end = lastBracket;

        if (start !== -1 && end !== -1 && end > start) {
          return text.substring(start, end + 1).trim();
        }

        return text.trim();
      };

      outputText = extractJson(outputText);

      // Defensive stripping in case backend missed any markdown wrappers
      if (typeof outputText === 'string') {
        outputText = outputText.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
      }

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