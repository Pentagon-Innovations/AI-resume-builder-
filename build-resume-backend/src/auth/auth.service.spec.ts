import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createMockUser, createMockConfigService } from '../test/test-utils';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        findByGoogleId: jest.fn(),
                        findByLinkedinId: jest.fn(),
                        findByResetToken: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(() => 'mock-jwt-token'),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: createMockConfigService(),
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user object when credentials are valid', async () => {
            const mockUser = createMockUser();
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            const result = await service.validateUser('test@example.com', 'password');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
        });

        it('should return null when credentials are invalid', async () => {
            const mockUser = createMockUser();
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            const result = await service.validateUser('test@example.com', 'wrongpassword');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user info', async () => {
            const mockUser = createMockUser();

            const result = await service.login(mockUser);

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('test@example.com');
        });
    });

    describe('register', () => {
        it('should create new user and return login response', async () => {
            const createUserDto = {
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            };

            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(createMockUser(createUserDto));

            const result = await service.register(createUserDto);

            expect(result).toHaveProperty('access_token');
            expect(usersService.create).toHaveBeenCalled();
        });

        it('should throw error if user already exists', async () => {
            const createUserDto = {
                email: 'existing@example.com',
                password: 'password123',
            };

            (usersService.findByEmail as jest.Mock).mockResolvedValue(createMockUser());

            await expect(service.register(createUserDto)).rejects.toThrow();
        });
    });

    describe('validateOAuthUser', () => {
        it('should return existing user for Google OAuth', async () => {
            const mockUser = createMockUser({ googleId: 'google123' });
            const profile = {
                id: 'google123',
                emails: [{ value: 'test@example.com' }],
                name: { givenName: 'Test', familyName: 'User' },
            };

            (usersService.findByGoogleId as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.validateOAuthUser(profile, 'google');

            expect(result).toEqual(mockUser);
        });

        it('should create new user if OAuth user does not exist', async () => {
            const profile = {
                id: 'google123',
                emails: [{ value: 'newuser@example.com' }],
                name: { givenName: 'New', familyName: 'User' },
            };

            (usersService.findByGoogleId as jest.Mock).mockResolvedValue(null);
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(createMockUser({ googleId: 'google123' }));

            const result = await service.validateOAuthUser(profile, 'google');

            expect(usersService.create).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });
});
