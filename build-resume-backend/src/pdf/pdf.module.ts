import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeSchema } from '../resume/resume.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Resume', schema: ResumeSchema }]),
    AuthModule,
  ],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule { }
