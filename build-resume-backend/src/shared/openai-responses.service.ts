import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const unirest = require('unirest');

@Injectable()
export class OpenAIResponsesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1/responses';
  private readonly defaultModel = 'gpt-5.2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateResponse(input: string, model: string = this.defaultModel, store: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
      unirest.post(this.baseUrl)
        .headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        })
        .send({
          model,
          input,
          store,
        })
        .end((res: any) => {
          if (res.error) {
            console.error('OpenAI Responses API Error:', res.body);
            reject({ status: res.status, message: JSON.stringify(res.body) });
          } else {
            const outputText = res.body?.output_text || res.body?.output || '';
            if (!outputText) {
              console.error('No output_text in response:', res.body);
              reject(new Error('No output_text in OpenAI response'));
            } else {
              resolve(outputText);
            }
          }
        });
    });
  }

  async generateJSONResponse(input: string, model: string = this.defaultModel): Promise<any> {
    const response = await this.generateResponse(input, model);
    
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

