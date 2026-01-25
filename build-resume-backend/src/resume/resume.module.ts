import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeSchema } from './resume.schema';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      storage: undefined, // Uses memory storage by default
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    }),
    MongooseModule.forFeature([{ name: 'Resume', schema: ResumeSchema }]),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
