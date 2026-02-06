import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TestController],
  providers: [OpenAIResponsesService],
})
export class TestModule { }

