import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@sparticuz/chromium', () => ({
    args: [],
    defaultViewport: {},
    executablePath: jest.fn().mockResolvedValue('/usr/bin/google-chrome'),
    headless: true,
}), { virtual: true });

const mockPdfReader = jest.fn().mockImplementation(() => ({
    parseBuffer: jest.fn().mockImplementation((buffer, callback) => {
        callback(null, { text: 'Mocked resume text content' });
        callback(null, null);
    }),
}));

jest.mock('pdfreader', () => ({
    PdfReader: mockPdfReader,
    default: { PdfReader: mockPdfReader },
    __esModule: true,
}), { virtual: true });

jest.mock('mammoth', () => ({
    extractRawText: jest.fn().mockResolvedValue({ value: 'Mocked DOCX text content' }),
}), { virtual: true });

jest.mock('unirest', () => ({
    get: jest.fn().mockReturnThis(),
    headers: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    end: jest.fn().mockImplementation((callback) => callback({ body: '<html><body>Job Description</body></html>' })),
}), { virtual: true });

jest.mock('cheerio', () => ({
    load: jest.fn().mockReturnValue(() => ({
        text: jest.fn().mockReturnValue('Mocked job description from cheerio'),
    })),
}), { virtual: true });

import { AnalyzeService } from './analyze.service';
import { ConfigService } from '@nestjs/config';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
import { createMockConfigService, createMockFile } from '../test/test-utils';

describe('AnalyzeService', () => {
    let service: AnalyzeService;
    let openAIService: OpenAIResponsesService;
    let mockCandidateModel: any;
    let mockJobModel: any;

    beforeEach(async () => {
        const MockApplicationModel = jest.fn().mockImplementation((dto) => ({
            ...dto,
            save: jest.fn().mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439014' }),
        }));
        (MockApplicationModel as any).find = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockApplicationModel as any).findById = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockApplicationModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockApplicationModel as any).findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockApplicationModel as any).deleteMany = jest.fn().mockReturnValue({ exec: jest.fn() });

        mockCandidateModel = MockApplicationModel;

        const MockJobModel = jest.fn().mockImplementation((dto) => ({
            ...dto,
            save: jest.fn().mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439013' }),
        }));
        (MockJobModel as any).find = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockJobModel as any).findById = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockJobModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
        (MockJobModel as any).findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });

        mockJobModel = MockJobModel;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyzeService,
                {
                    provide: ConfigService,
                    useValue: createMockConfigService(),
                },
                {
                    provide: OpenAIResponsesService,
                    useValue: {
                        generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
                            matchScore: 85,
                            matchedSkills: ['Node.js'],
                            missingSkills: ['React'],
                            matchedKeywords: ['developer'],
                            missingKeywords: ['senior'],
                            role: 'Software Engineer',
                            company: 'Tech Corp',
                            personalInfo: { name: 'Jane Doe', email: 'jane@example.com' },
                            summary: 'Experienced developer',
                            experience: [{ company: 'Tech Corp', duration: '5 years' }],
                            projects: [],
                            title: 'Software Engineer',
                            description: 'Job description',
                            name: 'John Doe'
                        })),
                        extractContent: jest.fn().mockImplementation((res) => res),
                    },
                },
            ],
        }).compile();

        service = module.get<AnalyzeService>(AnalyzeService);
        openAIService = module.get<OpenAIResponsesService>(OpenAIResponsesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('analyze', () => {
        it('should analyze resume against job description', async () => {
            const mockFile = createMockFile({ mimetype: 'text/plain', originalname: 'resume.txt' });
            const jd = 'Looking for Node.js developer with 5 years experience';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    matchScore: 85,
                    matchedSkills: ['Node.js', 'JavaScript'],
                    missingSkills: ['React'],
                    matchedKeywords: ['developer', 'experience'],
                    missingKeywords: ['senior'],
                })
            );

            const result = await service.analyze(mockFile, jd, '');

            expect(result).toBeDefined();
            expect(result.matchScore).toBeDefined();
        });
        it('should handle DOCX files', async () => {
            const mockFile = createMockFile({
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                originalname: 'resume.docx',
            });

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({ matchScore: 75, matchedSkills: [], missingSkills: [] })
            );

            const result = await service.analyze(mockFile, 'Looking for an experienced software engineer with proficiency in Node.js and TypeScript.', '');

            expect(result).toBeDefined();
            expect(result.matchScore).toBeDefined();
        });
    });

    describe('generateJD', () => {
        it('should generate JD from URL', async () => {
            const url = 'https://example.com/job';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    role: 'Senior Software Engineer',
                    company: 'Tech Corp International',
                    skills: ['React', 'NestJS'],
                    responsibilities: ['Full-stack development'],
                    qualifications: ['5 years experience'],
                    experience: '5 years',
                    fullDescription: 'We are looking for a Senior Software Engineer with at least 5 years of experience in full-stack development using React and NestJS. The ideal candidate should have strong problem-solving skills.',
                })
            );

            // Mock fetchJobDescription to return something valid so it doesn't return empty for example.com
            jest.spyOn(service as any, 'fetchJobDescription').mockResolvedValue('Mocked raw JD content that is long enough to pass the check.');

            const result = await (service as any).generateJD(url);

            expect(result).toBeDefined();
            expect(result.fullDescription).toBeDefined();
            expect(result.role).toBe('Senior Software Engineer');
        });
    });

    describe('parseResumeToJson', () => {
        it('should parse resume to structured JSON', async () => {
            const mockFile = createMockFile({ mimetype: 'text/plain', originalname: 'resume.txt' });

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    name: 'John Doe',
                    title: 'Software Engineer',
                    experience: [{ company: 'Tech Corp', duration: '5 years' }],
                })
            );

            const result = await service.parseResumeToJson(mockFile);

            expect(result).toBeDefined();
            expect(result.name).toBe('John Doe');
        });
    });
});

