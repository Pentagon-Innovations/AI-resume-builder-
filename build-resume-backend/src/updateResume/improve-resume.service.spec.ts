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

import { ImproveResumeService } from './improve-resume.service';
import { ConfigService } from '@nestjs/config';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
import { createMockConfigService, createMockFile } from '../test/test-utils';

describe('ImproveResumeService', () => {
    let service: ImproveResumeService;
    let openAIService: OpenAIResponsesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImproveResumeService,
                {
                    provide: ConfigService,
                    useValue: createMockConfigService(),
                },
                {
                    provide: OpenAIResponsesService,
                    useValue: {
                        generateResponse: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ImproveResumeService>(ImproveResumeService);
        openAIService = module.get<OpenAIResponsesService>(OpenAIResponsesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('improveSection', () => {
        it('should improve a resume section', async () => {
            const sectionName = 'summary';
            const sectionContent = 'Experienced developer';
            const jdText = 'Looking for senior developer with leadership skills';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                'Experienced senior developer with proven leadership skills and track record of delivering complex projects.'
            );

            const result = await service.improveSection(sectionName, sectionContent, jdText);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });

        it('should improve section without JD', async () => {
            const sectionName = 'experience';
            const sectionContent = 'Worked at Tech Corp';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                'Led development team at Tech Corp, delivering multiple high-impact projects.'
            );

            const result = await service.improveSection(sectionName, sectionContent);

            expect(result).toBeDefined();
        });
    });

    describe('generateContent', () => {
        it('should generate content from prompt', async () => {
            const prompt = 'Write a professional summary for a software engineer';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                'Innovative software engineer with 5+ years of experience...'
            );

            const result = await service.generateContent(prompt);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('autoFillMissingSkills', () => {
        it('should suggest improvements for missing skills', async () => {
            const resumeJson = {
                experience: [
                    {
                        title: 'Developer',
                        company: 'Tech Corp',
                        description: 'Built web applications',
                    },
                ],
            };
            const missingSkills = ['React', 'TypeScript'];
            const jdText = 'Looking for React and TypeScript developer';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    suggestedUpdates: [
                        { section: "skills", addition: "React, TypeScript" }
                    ]
                })
            );

            const result = await service.autoFillMissingSkills(resumeJson, missingSkills, jdText);

            expect(result).toBeDefined();
            expect(result.suggestedUpdates).toBeDefined();
        });
    });

    describe('fullAutoImprove', () => {
        it('should perform complete resume improvement', async () => {
            const mockFile = createMockFile();
            const jdText = 'Senior developer position';
            const missingSkills = ['React'];
            const missingKeywords = ['leadership'];

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
                    summery: 'Experienced dynamic leader',
                    experience: [{ title: 'Senior Developer', companyName: 'Tech Corp', workSummery: '<ul><li>Led team</li></ul>' }],
                    skills: [{ name: 'React', rating: 5 }]
                })
            );

            const result = await service.fullAutoImprove(mockFile, jdText, missingSkills, missingKeywords);

            expect(result).toBeDefined();
            expect(result.firstName).toBe('Jane');
        });
    });

    describe('autofillWithEmbeddings', () => {
        it('should autofill resume using embeddings', async () => {
            const mockFile = createMockFile();
            const jd = 'Job description for developer';

            (openAIService.generateResponse as jest.Mock).mockResolvedValue(
                JSON.stringify({
                    firstName: 'Jane', lastName: 'Smith',
                    experience: [],
                    skills: [{ name: 'Node.js', rating: 5 }]
                })
            );

            const result = await service.autofillWithEmbeddings(mockFile, jd);

            expect(result).toBeDefined();
            expect(result.skills).toBeDefined();
        });
    });
});
