import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImproveResumeService } from "./improve-resume.service";
import { Response } from "express";
import { UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller("improve-resume")
export class ImproveResumeController {
  constructor(
    private service: ImproveResumeService,
    private usersService: UsersService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor("resume"))
  async improve(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Request() req
  ) {
    const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
    if (!quota.authorized) {
      throw new ForbiddenException('Monthly AI limit reached. Please upgrade to Pro.');
    }
    if (!file) {
      return res.status(400).json({ message: "Resume file is missing" });
    }

    console.log("Received resume:", file.originalname);

    // PDF bytes buffer
    const resumeBuffer = file.buffer;

    // Send buffer to service for improving
    const improvedPdf = await this.service.improve(resumeBuffer);

    // Return the improved PDF file
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Improved_Resume.pdf",
    });

    return res.send(improvedPdf);
  }

  @Post("full-auto-improve")
  @UseInterceptors(FileInterceptor("resume"))
  async fullAutoImprove(
    @UploadedFile() file: Express.Multer.File,
    @Body("jobDescription") jobDescription: string,
    @Body("missingSkills") missingSkills: string, // JSON string from form data
    @Body("missingKeywords") missingKeywords: string, // JSON string
    @Request() req
  ) {
    // Optional quota check for logged-in users
    if (req.user && req.user.userId) {
      const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
      if (!quota.authorized) {
        throw new ForbiddenException('Monthly AI limit reached. Please upgrade to Pro.');
      }
    }
    console.log("[CONTROLLER] fullAutoImprove called");
    console.log("File:", file ? `Present (${file.originalname}, ${file.size} bytes)` : "Missing");
    console.log("JD:", jobDescription ? "Present" : "Missing");
    console.log("Missing Skills (Raw):", missingSkills);
    console.log("Missing Keywords (Raw):", missingKeywords);

    if (!file) {
      throw new Error("Resume file is required");
    }
    if (!jobDescription) {
      throw new Error("Job description is required");
    }

    let skills = [];
    let keywords = [];

    try {
      skills = missingSkills ? JSON.parse(missingSkills) : [];
    } catch (e) {
      console.error("Error parsing missingSkills:", e.message);
      skills = [];
    }

    try {
      keywords = missingKeywords ? JSON.parse(missingKeywords) : [];
    } catch (e) {
      console.error("Error parsing missingKeywords:", e.message);
      keywords = [];
    }

    try {
      return await this.service.fullAutoImprove(file, jobDescription, skills, keywords);
    } catch (error: any) {
      console.error("[CONTROLLER] fullAutoImprove FAILED:", error);
      console.error(error.stack);
      // Determine if it's a 400 or 500
      if (error.message.includes("buffer is empty") || error.message.includes("Resume file")) {
        throw new Error(error.message); // Will likely be 500 unless we throw HttpException
      }
      throw new Error(error.message || "Failed to improve resume automatically");
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("autofill")
  @UseInterceptors(FileInterceptor("resume"))
  async autofill(
    @UploadedFile() file: Express.Multer.File,
    @Body("jobDescription") jobDescription: string,
    @Request() req
  ) {
    const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
    if (!quota.authorized) {
      throw new ForbiddenException('Monthly AI limit reached. Please upgrade to Pro.');
    }
    if (!file) {
      throw new Error("Resume file is required");
    }
    if (!jobDescription) {
      throw new Error("Job description is required");
    }
    try {
      return await this.service.autofillWithEmbeddings(file, jobDescription);
    } catch (error: any) {
      throw new Error(error.message || "Failed to autofill resume");
    }
  }
}
