jest.mock('pdfreader', () => ({
    PdfReader: jest.fn().mockImplementation(() => ({
        parseBuffer: jest.fn().mockImplementation((buffer, callback) => {
            callback(null, { text: 'Mocked resume text content' });
            callback(null, null);
        }),
    })),
    default: {
        PdfReader: jest.fn().mockImplementation(() => ({
            parseBuffer: jest.fn().mockImplementation((buffer, callback) => {
                callback(null, { text: 'Mocked resume text content' });
                callback(null, null);
            }),
        }))
    },
    __esModule: true,
}), { virtual: true });

jest.mock('@sparticuz/chromium', () => ({
    args: [],
    defaultViewport: {},
    executablePath: jest.fn().mockResolvedValue('/usr/bin/google-chrome'),
    headless: true,
}), { virtual: true });

jest.mock('puppeteer-core', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn(),
            pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content')),
            close: jest.fn(),
        }),
        close: jest.fn(),
    }),
}), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { ATSService } from './ats.service';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyzeService } from '../analyze/analyze.service';
import { createMockJob, createMockCandidate, createMockFile } from '../test/test-utils';

describe('ATSService', () => {
    let service: ATSService;
    let mockJobModel: any;
    let mockCandidateModel: any;
    let analyzeService: AnalyzeService;

    beforeEach(async () => {
        const MockAppModel = jest.fn().mockImplementation(function (data) {
            Object.assign(this, data);
            this.save = jest.fn().mockResolvedValue({ ...data, _id: '507f1f77bcf86cd799439014' });
            return this;
        });

        (MockAppModel as any).find = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), exec: jest.fn() });
        (MockAppModel as any).findById = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockAppModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockAppModel as any).findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockAppModel as any).deleteMany = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockAppModel as any).create = jest.fn();

        mockCandidateModel = MockAppModel;
        mockJobModel = MockAppModel;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ATSService,
                {
                    provide: getModelToken('Job'),
                    useFactory: () => mockJobModel,
                },
                {
                    provide: getModelToken('Application'),
                    useFactory: () => mockCandidateModel,
                },
                {
                    provide: AnalyzeService,
                    useValue: {
                        analyze: jest.fn().mockResolvedValue({
                            matchScore: 85,
                            matchedSkills: ['Node.js'],
                            missingSkills: ['React'],
                            resumeImprovements: ['Add TypeScript'],
                        }),
                        parseResumeToJson: jest.fn().mockResolvedValue({
                            personalInfo: { name: 'Jane Smith', email: 'jane@example.com' }
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<ATSService>(ATSService);
        analyzeService = module.get<AnalyzeService>(AnalyzeService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createJob', () => {
        it('should create a new job', async () => {
            const jobData = {
                recruiterId: '507f1f77bcf86cd799439011',
                title: 'Senior Developer',
                company: 'Tech Corp',
            };

            const result = await service.createJob(jobData);

            expect(result).toMatchObject(jobData);
            expect(result._id).toBeDefined();
        });
    });

    describe('listJobs', () => {
        it('should return all jobs for a recruiter', async () => {
            const mockJobs = [createMockJob(), createMockJob({ title: 'Junior Developer' })];
            mockJobModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockJobs),
            });

            const result = await service.listJobs('507f1f77bcf86cd799439011');
            expect(result).toEqual(mockJobs);
        });
    });

    describe('screenResumes', () => {
        it('should screen multiple resumes', async () => {
            const mockJob = createMockJob();
            const mockFiles = [createMockFile(), createMockFile({ originalname: 'resume2.pdf' })];
            const mockCandidate = createMockCandidate();

            mockJobModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockJob),
            });

            (analyzeService.analyze as jest.Mock).mockResolvedValue({
                score: 85,
                matchedSkills: ['Node.js'],
                missingSkills: ['React'],
                resumeText: 'Resume content',
            });

            const result = await service.screenResumes(mockJob._id, mockFiles, mockJob.recruiterId);

            expect(result).toBeDefined();
            expect(analyzeService.analyze).toHaveBeenCalled();
        });
    });

    describe('getRankedCandidates', () => {
        it('should return candidates sorted by score', async () => {
            const mockCandidates = [
                createMockCandidate({ score: 90 }),
                createMockCandidate({ score: 75 }),
            ];

            mockCandidateModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockCandidates),
                }),
            });

            const result = await service.getRankedCandidates('507f1f77bcf86cd799439013');

            expect(result).toEqual(mockCandidates);
        });
    });

    describe('deleteJob', () => {
        it('should delete job and associated candidates', async () => {
            const mockJob = createMockJob();
            mockJobModel.findByIdAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockJob),
            });
            mockCandidateModel.deleteMany.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
            });

            const result = await service.deleteJob('507f1f77bcf86cd799439013');

            expect(result).toEqual(mockJob);
            expect(mockCandidateModel.deleteMany).toHaveBeenCalledWith({ jobId: '507f1f77bcf86cd799439013' });
        });
    });

    describe('updateCandidate', () => {
        it('should update candidate ranking', async () => {
            const updates = { ranking: 1 };
            const updatedCandidate = createMockCandidate(updates);

            mockCandidateModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedCandidate),
            });

            const result = await service.updateCandidate('507f1f77bcf86cd799439014', updates);

            expect(result).toEqual(updatedCandidate);
        });
    });
});
