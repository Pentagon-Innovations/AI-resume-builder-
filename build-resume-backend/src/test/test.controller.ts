import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('test')
export class TestController {
  constructor(private openAIResponsesService: OpenAIResponsesService) { }

  @Get('openai')
  async testOpenAI() {
    try {
      const testInput = 'Say "OpenRouter API is working!" in a friendly way.';
      const response = await this.openAIResponsesService.generateResponse(
        testInput,
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

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  testAuth(@Request() req) {
    return {
      message: 'Authentication is working!',
      user: req.user,
    };
  }
}

