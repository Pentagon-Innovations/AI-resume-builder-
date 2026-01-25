import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { UsersModule } from '../users/users.module';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

@Module({
  imports: [UsersModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService, OpenAIResponsesService],
  exports: [AnalyzeService],
})
export class AnalyzeModule { }
