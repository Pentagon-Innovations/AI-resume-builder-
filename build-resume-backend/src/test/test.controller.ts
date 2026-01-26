import { Controller, Get } from '@nestjs/common';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

@Controller('test')
export class TestController {
  constructor(private openAIResponsesService: OpenAIResponsesService) {}

  @Get('openai')
  async testOpenAI() {
    try {
      const testInput = 'Say "OpenAI API is working!" in a friendly way.';
      const response = await this.openAIResponsesService.generateResponse(
        testInput,
        'gpt-5.2',
        false, // Don't store test requests
      );

      return {
        success: true,
        message: 'OpenAI API is working!',
        response: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'OpenAI API test failed',
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

