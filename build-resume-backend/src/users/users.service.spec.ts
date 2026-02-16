import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { createMockUser, createMockConfigService } from '../test/test-utils';

describe('UsersService', () => {
    let service: UsersService;
    let mockUserModel: any;

    beforeEach(async () => {
        mockUserModel = jest.fn().mockImplementation((dto) => ({
            ...dto,
            save: jest.fn().mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439011' }),
        }));

        // Add static methods to the constructor function
        (mockUserModel as any).create = jest.fn();
        (mockUserModel as any).findOne = jest.fn();
        (mockUserModel as any).findById = jest.fn();
        (mockUserModel as any).findByIdAndUpdate = jest.fn();
        (mockUserModel as any).exec = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken('User'),
                    useValue: mockUserModel,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'hashedpassword',
                firstName: 'New',
                lastName: 'User',
            };

            const result = await service.create(userData);

            expect(result).toMatchObject(userData);
            expect(result).toHaveProperty('_id');
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const mockUser = createMockUser();
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return null if user not found', async () => {
            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find user by ID', async () => {
            const mockUser = createMockUser();
            mockUserModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findById('507f1f77bcf86cd799439011');

            expect(result).toEqual(mockUser);
        });
    });

    describe('checkAndUpdateQuota', () => {
        it('should authorize when user has remaining quota', async () => {
            const mockUser = createMockUser({ aiRunsThisMonth: 5, maxAiRuns: 10 });
            mockUserModel.findById.mockResolvedValue({
                ...mockUser,
                save: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.checkAndUpdateQuota('507f1f77bcf86cd799439011');

            expect(result.authorized).toBe(true);
            expect(result.remaining).toBe(5);
        });

        it('should deny when quota is exhausted', async () => {
            const mockUser = createMockUser({ aiRunsThisMonth: 10, maxAiRuns: 10 });
            mockUserModel.findById.mockResolvedValue({
                ...mockUser,
                save: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.checkAndUpdateQuota('507f1f77bcf86cd799439011');

            expect(result.authorized).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should reset quota at the beginning of new month', async () => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const mockUser = createMockUser({
                aiRunsThisMonth: 10,
                maxAiRuns: 10,
                lastQuotaReset: lastMonth
            });

            const saveMock = jest.fn().mockResolvedValue(mockUser);
            mockUserModel.findById.mockResolvedValue({
                ...mockUser,
                save: saveMock,
            });

            const result = await service.checkAndUpdateQuota('507f1f77bcf86cd799439011');

            expect(saveMock).toHaveBeenCalled();
            expect(result.authorized).toBe(true);
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const updates = { firstName: 'Updated' };
            const updatedUser = createMockUser(updates);

            mockUserModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedUser),
            });

            const result = await service.update('507f1f77bcf86cd799439011', updates);

            expect(result).toEqual(updatedUser);
        });
    });
});
