import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

@Module({
  controllers: [TestController],
  providers: [OpenAIResponsesService],
})
export class TestModule {}

