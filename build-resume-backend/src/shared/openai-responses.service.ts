import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const unirest = require('unirest');

@Injectable()
export class OpenAIResponsesService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly openaiBaseUrl = 'https://api.openai.com/v1/responses';
  private readonly defaultModel = 'gpt-4.1-mini';
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

    // Handle array response (seen in user logs)
    if (Array.isArray(body)) {
      console.log('[DEBUG] AI Response is an array, checking elements...');
      for (const item of body) {
        const text = this.extractContent(item);
        if (text && text !== 'assistant') return text;
      }
      return '';
    }

    // 1. Standard OpenAI format
    if (body.choices?.[0]?.message?.content) {
      return body.choices[0].message.content;
    }

    // 2. Anthropic-style format via OpenRouter
    if (Array.isArray(body.content)) {
      console.log('[DEBUG] AI Response has content array, searching for text...');
      for (const item of body.content) {
        if (typeof item === 'string' && item.length > 0) return item;
        const text = item.text || item.output_text || item.output || item.content;
        if (text && typeof text === 'string') return text;
      }
    }

    // 3. Direct content/output fields
    const directContent = body.content || body.output || body.response || body.result || body.text;
    if (typeof directContent === 'string') return directContent;
    if (typeof directContent === 'object' && directContent !== null) {
      // Recurse once if the content itself is an object
      return this.extractContent(directContent);
    }

    return '';
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

  async generateJSONResponse(input: string, model: string = this.defaultModel): Promise<any> {
    // Add instruction to return JSON
    const jsonPrompt = `${input}\n\nPlease respond with valid JSON only, no markdown formatting.`;
    const response = await this.generateResponse(jsonPrompt, model);

    // Try to extract JSON from the response
    const cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      // Try to find JSON object in the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

