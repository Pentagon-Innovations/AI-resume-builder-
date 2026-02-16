import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Mock User Factory
 */
export const createMockUser = (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    plan: 'free',
    maxAiRuns: 10,
    aiRunsThisMonth: 0,
    lastQuotaReset: new Date(),
    createdAt: new Date(),
    googleId: undefined,
    linkedinId: undefined,
    picture: undefined,
    role: 'user',
    refreshToken: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    subscription: undefined,
    toObject: function () { return this; },
    ...overrides,
});

/**
 * Mock Resume Factory
 */
export const createMockResume = (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
    userEmail: 'test@example.com',
    title: 'Software Engineer Resume',
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'Software Engineer',
    address: '123 Main St',
    phone: '1234567890',
    email: 'john@example.com',
    themeColor: '#000000',
    summary: 'Experienced software engineer',
    experience: [],
    education: [],
    skills: [],
    profilePhoto: undefined,
    createdAt: new Date(),
    ...overrides,
});

/**
 * Mock Job Factory
 */
export const createMockJob = (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439013',
    recruiterId: '507f1f77bcf86cd799439011',
    title: 'Senior Developer',
    company: 'Tech Corp',
    location: 'Remote',
    description: 'Looking for a senior developer',
    requirements: ['5+ years experience', 'Node.js', 'TypeScript'],
    createdAt: new Date(),
    ...overrides,
});

/**
 * Mock Candidate Factory
 */
export const createMockCandidate = (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439014',
    jobId: '507f1f77bcf86cd799439013',
    name: 'Jane Smith',
    email: 'jane@example.com',
    resumeText: 'Experienced developer with 5 years...',
    score: 85,
    matchedSkills: ['Node.js', 'TypeScript'],
    missingSkills: ['React'],
    createdAt: new Date(),
    ...overrides,
});

/**
 * Mock File Upload
 */
export const createMockFile = (overrides = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('mock file content'),
    stream: null as any,
    destination: '',
    filename: 'resume.pdf',
    path: '',
    ...overrides,
});

/**
 * Generate Mock JWT Token
 */
export const generateMockToken = (payload = {}) => {
    const jwtService = new JwtService({
        secret: 'test-secret',
    });
    return jwtService.sign({
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        ...payload,
    });
};

/**
 * Mock MongoDB Connection for Testing
 */
export const getTestMongooseModule = () => {
    return MongooseModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
            uri: configService.get('MONGODB_URI') || 'mongodb://localhost:27017/test',
        }),
        inject: [ConfigService],
    });
};

/**
 * Mock ConfigService
 */
export const createMockConfigService = () => ({
    get: jest.fn((key: string) => {
        const config = {
            JWT_SECRET: 'test-secret',
            JWT_EXPIRES_IN: '1h',
            MONGODB_URI: 'mongodb://localhost:27017/test',
            OPENAI_API_KEY: 'test-openai-key',
            GEMINI_API_KEY: 'test-gemini-key',
            RAZORPAY_KEY_ID: 'test-razorpay-key',
            RAZORPAY_KEY_SECRET: 'test-razorpay-secret',
            FRONTEND_URL: 'http://localhost:5173',
        };
        return config[key];
    }),
});

/**
 * Mock Request with User
 */
export const createMockRequest = (user = {}) => ({
    user: {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        ...user,
    },
    headers: {},
    body: {},
    query: {},
    params: {},
});

/**
 * Mock Response
 */
export const createMockResponse = () => {
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
    };
    return res;
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean up test database
 */
export const cleanupDatabase = async (models: any[]) => {
    for (const model of models) {
        await model.deleteMany({});
    }
};
