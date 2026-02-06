import { Module } from '@nestjs/common';
import { ImproveResumeService } from './improve-resume.service';
import { ImproveResumeController } from './improve-resume.controller';
import { UsersModule } from '../users/users.module';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [ImproveResumeController],
  providers: [ImproveResumeService, OpenAIResponsesService],
})
export class ImproveResumeModule { }
