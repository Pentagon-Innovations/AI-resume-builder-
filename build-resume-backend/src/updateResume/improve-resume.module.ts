import { Module } from '@nestjs/common';
import { ImproveResumeService } from './improve-resume.service';
import { ImproveResumeController } from './improve-resume.controller';
import { UsersModule } from '../users/users.module';
import { OpenAIResponsesService } from '../shared/openai-responses.service';

@Module({
  imports: [UsersModule],
  controllers: [ImproveResumeController],
  providers: [ImproveResumeService, OpenAIResponsesService],
})
export class ImproveResumeModule { }
