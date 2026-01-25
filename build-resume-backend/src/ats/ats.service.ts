import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, Application } from './ats.schema';
import { AnalyzeService } from '../analyze/analyze.service';
import { readFileSync } from 'fs';

@Injectable()
export class ATSService {
    constructor(
        @InjectModel('Job') private jobModel: Model<Job>,
        @InjectModel('Application') private applicationModel: Model<Application>,
        private analyzeService: AnalyzeService,
    ) { }

    async createJob(jobData: Partial<Job>): Promise<Job> {
        return new this.jobModel(jobData).save();
    }

    async listJobs(recruiterId: string): Promise<Job[]> {
        return this.jobModel.find({ recruiterId }).sort({ createdAt: -1 }).exec();
    }

    async getJob(jobId: string): Promise<Job | null> {
        return this.jobModel.findById(jobId).exec();
    }

    async screenResumes(jobId: string, files: Express.Multer.File[], recruiterId: string): Promise<any[]> {
        const job = await this.getJob(jobId);
        if (!job) throw new BadRequestException('Job not found');

        const results: any[] = [];
        for (const file of files) {
            try {
                // Reuse existing analyze logic
                // The analyze method in AnalyzeService expects (file, jd, jobUrl)
                const analysis = await this.analyzeService.analyze(file, job.description, '');

                // Extract candidate info from resume if possible (simple extraction for now)
                // In a real system, we'd use the parseResumeToJson method
                const parsedResume = await this.analyzeService.parseResumeToJson(file);

                const application = new this.applicationModel({
                    jobId: jobId,
                    candidateName: parsedResume.personalInfo?.name || file.originalname,
                    candidateEmail: parsedResume.personalInfo?.email || 'N/A',
                    resumeText: '...', // We don't want to store full text in DB for now to save space, or we could.
                    score: analysis.matchScore || 0,
                    matchAnalysis: analysis.resumeImprovements?.join('\n') || '',
                    missingSkills: analysis.missingSkills || [],
                    missingKeywords: analysis.missingKeywords || [],
                    interviewQuestions: analysis.interviewQuestions || [],
                    recruiterId: recruiterId,
                });

                console.log(`[DEBUG] Saving Application for ${application.candidateName}:`, {
                    score: application.score,
                    questions: application.interviewQuestions?.length,
                    skills: application.missingSkills?.length
                });

                await application.save();
                results.push(application);
            } catch (err) {
                console.error(`Failed to screen file ${file.originalname}:`, err);
            }
        }

        return results;
    }

    async getRankedCandidates(jobId: string): Promise<Application[]> {
        return this.applicationModel.find({ jobId }).sort({ score: -1 }).exec();
    }

    async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job | null> {
        return this.jobModel.findByIdAndUpdate(jobId, jobData, { new: true }).exec();
    }

    async deleteJob(jobId: string): Promise<any> {
        await this.applicationModel.deleteMany({ jobId }).exec();
        return this.jobModel.findByIdAndDelete(jobId).exec();
    }

    async deleteCandidate(candidateId: string): Promise<any> {
        return this.applicationModel.findByIdAndDelete(candidateId).exec();
    }

    async updateCandidate(candidateId: string, data: Partial<Application>): Promise<Application | null> {
        return this.applicationModel.findByIdAndUpdate(candidateId, data, { new: true }).exec();
    }

    async listAllCandidates(recruiterId: string): Promise<Application[]> {
        return this.applicationModel.find({ recruiterId }).sort({ createdAt: -1 }).populate('jobId', 'title company').exec();
    }
}
