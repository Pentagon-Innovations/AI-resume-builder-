import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { createMockUser, createMockConfigService, createMockRequest, createMockResponse } from '../test/test-utils';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        validateUser: jest.fn(),
                        login: jest.fn(),
                        register: jest.fn(),
                        forgotPassword: jest.fn(),
                        resetPassword: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: createMockConfigService(),
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should return access token on successful login', async () => {
            const mockReq = createMockRequest();
            const mockToken = { access_token: 'jwt-token', refresh_token: 'refresh-token', user: {} };

            (authService.login as jest.Mock).mockResolvedValue(mockToken);

            const result = await controller.login(mockReq);

            expect(result).toEqual(mockToken);
            expect(authService.login).toHaveBeenCalledWith(mockReq.user);
        });
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const createUserDto = {
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            };

            const mockResponse = { access_token: 'token', user: createMockUser(createUserDto) };
            (authService.register as jest.Mock).mockResolvedValue(mockResponse);

            const result = await controller.register(createUserDto);

            expect(result).toEqual(mockResponse);
            expect(authService.register).toHaveBeenCalledWith(createUserDto);
        });
    });

    describe('OAuth flows', () => {
        it('should handle Google OAuth redirect', async () => {
            const mockReq = createMockRequest({ email: 'google@example.com' });
            const mockRes = createMockResponse();

            (authService.login as jest.Mock).mockResolvedValue({
                access_token: 'jwt-token',
                refresh_token: 'refresh-token',
                user: { email: 'google@example.com', firstName: 'Google', lastName: 'User' },
            });

            await controller.googleAuthRedirect(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalled();
        });

        it('should handle LinkedIn OAuth redirect', async () => {
            const mockReq = createMockRequest({ email: 'linkedin@example.com' });
            const mockRes = createMockResponse();

            (authService.login as jest.Mock).mockResolvedValue({
                access_token: 'jwt-token',
                refresh_token: 'refresh-token',
                user: { email: 'linkedin@example.com', firstName: 'LinkedIn', lastName: 'User' },
            });

            await controller.linkedinAuthRedirect(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalled();
        });
    });
});
