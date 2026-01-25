import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ATSService } from './ats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('ats')
export class ATSController {
    constructor(
        private readonly atsService: ATSService,
        private readonly usersService: UsersService
    ) { }

    @Get('test')
    test() {
        return { status: 'ATS Controller is working' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('jobs')
    async createJob(@Body() jobData: any, @Request() req) {
        console.log('--- ATS Create Job ---');
        console.log('User:', req.user);
        console.log('Data:', jobData);
        return this.atsService.createJob({ ...jobData, recruiterId: req.user.userId });
    }

    @UseGuards(JwtAuthGuard)
    @Get('jobs')
    async listJobs(@Request() req) {
        return this.atsService.listJobs(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('jobs/:id')
    async getJob(@Param('id') id: string) {
        return this.atsService.getJob(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('jobs/:id/screen')
    @UseInterceptors(FilesInterceptor('resumes', 20))
    async screenResumes(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
        console.log('[DEBUG] Screening resumes for user:', req.user);
        // Check quota once for the entire bulk screening session
        if (files && files.length > 0) {
            const quota = await this.usersService.checkAndUpdateQuota(req.user.userId);
            console.log('[DEBUG] Quota check result:', quota);
            if (!quota.authorized) {
                throw new ForbiddenException(`Monthly limit reached. Please upgrade to Pro for unlimited screening.`);
            }
        }
        return this.atsService.screenResumes(id, files, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('jobs/:id/candidates')
    async getCandidates(@Param('id') id: string) {
        return this.atsService.getRankedCandidates(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('jobs/:id')
    async updateJob(@Param('id') id: string, @Body() jobData: any) {
        return this.atsService.updateJob(id, jobData);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('jobs/:id')
    async deleteJob(@Param('id') id: string) {
        return this.atsService.deleteJob(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('candidates')
    async getAllCandidates(@Request() req) {
        return this.atsService.listAllCandidates(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('candidates/:id')
    async deleteCandidate(@Param('id') id: string) {
        return this.atsService.deleteCandidate(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('candidates/:id')
    async updateCandidate(@Param('id') id: string, @Body() data: any) {
        return this.atsService.updateCandidate(id, data);
    }
}
