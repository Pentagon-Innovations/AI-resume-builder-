import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const unirest = require('unirest');

@Injectable()
export class OpenAIResponsesService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly defaultModel = 'openai/gpt-4o';
  private readonly apiKey: string;
  private readonly backendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'https://resume-builder-backend-gold.vercel.app';
  }

  async generateResponse(input: string, model: string = this.defaultModel): Promise<string> {
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
            {
              role: 'user',
              content: input,
            },
          ],
        })
        .end((res: any) => {
          if (res.error) {
            console.error('OpenRouter API Error:', res.body);
            reject({ status: res.status, message: JSON.stringify(res.body) });
          } else {
            const content = res.body?.choices?.[0]?.message?.content || '';
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

