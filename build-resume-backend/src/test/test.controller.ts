import { Controller, Get } from '@nestjs/common';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

@Controller('test')
export class TestController {
  constructor(private openAIResponsesService: OpenAIResponsesService) {}

  @Get('openai')
  async testOpenAI() {
    try {
      const testInput = 'Say "OpenRouter API is working!" in a friendly way.';
      const response = await this.openAIResponsesService.generateResponse(
        testInput,
        'openai/gpt-4o',
      );

      return {
        success: true,
        message: 'OpenRouter API is working!',
        response: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'OpenRouter API test failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'Resume Builder Backend',
      timestamp: new Date().toISOString(),
    };
  }
}

