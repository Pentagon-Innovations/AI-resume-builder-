import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeService: AnalyzeService,
    private readonly usersService: UsersService
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('resume'))
  async analyzeResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
    @Body('jobUrl') jobUrl: string,
    @Request() req
  ) {
    // Optional quota check for logged-in users
    if (req.user && req.user.userId) {
      const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
      if (!quota.authorized) {
        throw new ForbiddenException('Monthly AI analysis limit reached (5/5). Please upgrade to Pro.');
      }
    }
    return this.analyzeService.analyze(file, jobDescription, jobUrl);
  }

  @Post('generate-jd')
  async generateJD(@Body('jobUrl') jobUrl: string, @Request() req) {
    // JD generation also uses LLM, so let's check quota too IF user is logged in
    if (req.user && req.user.userId) {
      const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
      if (!quota.authorized) {
        throw new ForbiddenException('Monthly limit reached. Please upgrade to Pro.');
      }
    }
    return this.analyzeService.generateJD(jobUrl);
  }

  @Post('parse-resume')
  @UseInterceptors(FileInterceptor('resume'))
  async parseResume(@UploadedFile() file: Express.Multer.File) {
    return this.analyzeService.parseResumeToJson(file);
  }
}
