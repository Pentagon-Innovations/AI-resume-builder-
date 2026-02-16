import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) { }

  @Post()
  async createNewResume(@Body() data: any, @Request() req) {
    console.log(`[RESUME] Create called by user: ${req.user?.userId || 'unknown'}`);

    // Hardening: Force userEmail from verified JWT for security/consistency
    if (req.user?.email) {
      data.userEmail = req.user.email;
    }

    return this.resumeService.createNewResume(data);
  }

  @Get()
  async getUserResumes(@Query('userEmail') userEmail: string, @Request() req) {
    console.log(`[RESUME] GetUserResumes called by user: ${req.user?.userId || 'unknown'}`);
    // Security: Use email from verified token if available, fallback to query param
    const emailToUse = req.user?.email || userEmail;
    return this.resumeService.getUserResumes(emailToUse);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updateResume(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log(`[RESUME] Update called for ID: ${id} by user: ${req.user?.userId || 'unknown'}`);
    console.log("Received file:", file ? `Present (${file.originalname})` : "Missing");
    return this.resumeService.updateResumeDetail(id, updateData, file);
  }

  @Get(':id')
  async getResumeById(@Param('id') id: string, @Request() req) {
    console.log(`[RESUME] GetById called for ID: ${id} by user: ${req.user?.userId || 'unknown'}`);
    return this.resumeService.getResumeById(id);
  }

  @Get(':id/photo')
  async getProfilePhoto(@Param('id') id: string, @Res() res: Response) {
    // Note: Photo access might need special handling if we want it public for PDFs
    // For now, keeping it under the controller's global guard
    try {
      const photo = await this.resumeService.getProfilePhoto(id);
      res.set('Content-Type', photo.contentType);
      return res.send(photo.data);
    } catch (error) {
      return res.status(404).send('Photo not found');
    }
  }

  @Delete(':id')
  async deleteResumeById(@Param('id') id: string, @Request() req) {
    console.log(`[RESUME] Delete called for ID: ${id} by user: ${req.user?.userId || 'unknown'}`);
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid resume ID');
    }
    return this.resumeService.deleteResumeById(id);
  }
}
