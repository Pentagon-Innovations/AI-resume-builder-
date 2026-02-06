import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const unirest = require('unirest');

@Injectable()
export class OpenAIResponsesService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly openaiBaseUrl = 'https://api.openai.com/v1/responses';
  private readonly defaultModel = 'gpt-4o-mini';
  private readonly apiKey: string;
  private readonly openaiApiKey: string | null;
  private readonly backendUrl: string;
  private readonly useOpenAI: boolean;

  constructor(private configService: ConfigService) {
    // Check for OpenAI API key first (preferred)
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openrouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (openaiApiKey) {
      this.openaiApiKey = openaiApiKey;
      this.apiKey = openaiApiKey; // Use OpenAI key
      this.useOpenAI = true;
    } else if (openrouterApiKey) {
      this.openaiApiKey = null;
      this.apiKey = openrouterApiKey;
      this.useOpenAI = false;
    } else {
      throw new Error('Either OPENAI_API_KEY or OPENROUTER_API_KEY environment variable is required');
    }

    this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'https://resume-builder-backend-gold.vercel.app';
  }

  async generateResponse(input: string, model: string = this.defaultModel): Promise<string> {
    if (this.useOpenAI) {
      return this.generateOpenAIResponse(input, model);
    } else {
      return this.generateOpenRouterResponse(input, model);
    }
  }

  public extractContent(body: any): string {
    if (!body) return '';

    let content = '';

    // Handle array response (seen in user logs)
    if (Array.isArray(body)) {
      console.log('[DEBUG] AI Response is an array, checking elements...');
      for (const item of body) {
        const text = this.extractContent(item);
        if (text && text !== 'assistant') {
          content = text;
          break;
        }
      }
    } else if (body.choices?.[0]?.message?.content) {
      // 1. Standard OpenAI format
      content = body.choices[0].message.content;
    } else if (Array.isArray(body.content)) {
      // 2. Anthropic-style format via OpenRouter
      console.log('[DEBUG] AI Response has content array, searching for text...');
      for (const item of body.content) {
        if (typeof item === 'string' && item.length > 0) {
          content = item;
          break;
        }
        const text = item.text || item.output_text || item.output || item.content;
        if (text && typeof text === 'string') {
          content = text;
          break;
        }
      }
    } else {
      // 3. Direct content/output fields
      const directContent = body.content || body.output || body.response || body.result || body.text;
      if (typeof directContent === 'string') {
        content = directContent;
      } else if (typeof directContent === 'object' && directContent !== null) {
        content = this.extractContent(directContent);
      }
    }

    if (!content) return '';

    // Aggressively strip markdown code blocks from ALL responses
    // AI often wraps HTML or JSON in ``` blocks which breaks frontend parsing
    return content
      .replace(/```[a-z]*\n/gi, '') // Remove opening ```json, ```html, etc.
      .replace(/```/g, '')         // Remove closing ```
      .trim();
  }

  private async generateOpenAIResponse(input: string, model: string): Promise<string> {
    const cleanModel = model.replace('openai/', '');

    // For gpt-4.1-mini and standard Chat models, we should use Chat Completions
    return this.generateOpenAIChatCompletions(input, cleanModel);
  }

  private async generateOpenAIChatCompletions(input: string, model: string): Promise<string> {
    return new Promise((resolve, reject) => {
      unirest.post('https://api.openai.com/v1/chat/completions')
        .headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        })
        .send({
          model: model,
          messages: [
            { role: 'user', content: input },
          ],
        })
        .end((res: any) => {
          if (res.error) {
            console.error('OpenAI Chat Completions API Error:', res.body);
            reject({ status: res.status, message: JSON.stringify(res.body) });
          } else {
            const content = this.extractContent(res.body);
            if (!content) {
              console.error('No content in OpenAI Chat Completions response:', res.body);
              reject(new Error('No content in OpenAI Chat Completions response'));
            } else {
              resolve(content);
            }
          }
        });
    });
  }

  private async generateOpenRouterResponse(input: string, model: string): Promise<string> {
    return new Promise((resolve, reject) => {
      unirest.post(this.baseUrl)
        .headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.backendUrl,
          'X-Title': 'ResumeAlign',
        })
        .send({
          model,
          messages: [
            { role: 'user', content: input },
          ],
        })
        .end((res: any) => {
          if (res.error) {
            console.error('OpenRouter API Error:', res.body);
            reject({ status: res.status, message: JSON.stringify(res.body) });
          } else {
            const content = this.extractContent(res.body);
            if (!content) {
              console.error('No content in OpenRouter response:', res.body);
              reject(new Error('No content in OpenRouter response'));
            } else {
              resolve(content);
            }
          }
        });
    });
  }

  private extractJsonData(text: string): string {
    if (!text) return '';

    // First, try standard code block extraction
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // Fallback: Find the first and last structural characters
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');

    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1).trim();
    }

    // Last resort: standard cleaning
    return text.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
  }

  async generateJSONResponse(input: string, model: string = this.defaultModel): Promise<any> {
    // Add instruction to return JSON
    const jsonPrompt = `${input}\n\nPlease respond with valid JSON only, no markdown formatting.`;
    const response = await this.generateResponse(jsonPrompt, model);

    const cleaned = this.extractJsonData(response);

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw content was:', response);
      console.error('Cleaned content was:', cleaned);

      // Final attempt: aggressive regex cleanup
      try {
        const fallbackMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (fallbackMatch) {
          return JSON.parse(fallbackMatch[0]);
        }
      } catch (e) { }

      throw new Error('Failed to parse AI response as JSON');
    }
  }
}
