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
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Res } from '@nestjs/common';

@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) { }

  @Post()
  async createNewResume(@Body() data: any) {
    return this.resumeService.createNewResume(data);
  }

  @Get()
  async getUserResumes(@Query('userEmail') userEmail: string) {
    return this.resumeService.getUserResumes(userEmail);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('profilePhoto')) // 📌 Add FileInterceptor to process files
  async updateResume(
    @Param('id') id: string,
    @Body() updateData: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log("Received file:", file); // Debugging
    console.log(updateData);
    return this.resumeService.updateResumeDetail(id, updateData, file);
  }

  @Get(':id')
  async getResumeById(@Param('id') id: string) {
    return this.resumeService.getResumeById(id);
  }

  @Get(':id/photo')
  async getProfilePhoto(@Param('id') id: string, @Res() res: Response) {
    try {
      const photo = await this.resumeService.getProfilePhoto(id);
      res.set('Content-Type', photo.contentType);
      return res.send(photo.data);
    } catch (error) {
      return res.status(404).send('Photo not found');
    }
  }

  @Delete(':id')
  async deleteResumeById(@Param('id') id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid resume ID');
    }
    return this.resumeService.deleteResumeById(id);
  }
}
