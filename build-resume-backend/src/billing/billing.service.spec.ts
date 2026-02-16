import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { createMockConfigService, createMockUser } from '../test/test-utils';

describe('BillingService', () => {
    let service: BillingService;
    let configService: ConfigService;
    let usersService: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                {
                    provide: ConfigService,
                    useValue: createMockConfigService(),
                },
                {
                    provide: UsersService,
                    useValue: {
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        configService = module.get<ConfigService>(ConfigService);
        usersService = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createRazorpayOrder', () => {
        it('should create a Razorpay order', async () => {
            const mockOrder = {
                id: 'order_123',
                amount: 50000,
                currency: 'INR',
                receipt: 'receipt_123',
            };

            // Mock the Razorpay instance
            (service as any).razorpay = {
                orders: {
                    create: jest.fn().mockResolvedValue(mockOrder),
                },
            };

            const result = await service.createRazorpayOrder(500, 'INR');

            expect(result).toEqual(mockOrder);
            expect((service as any).razorpay.orders.create).toHaveBeenCalledWith({
                amount: 50000, // 500 * 100
                currency: 'INR',
                receipt: expect.stringContaining('receipt_'),
            });
        });

        it('should throw error if Razorpay keys are missing', async () => {
            // Create a new instance without Razorpay keys
            const mockConfigWithoutKeys = {
                get: jest.fn((key: string) => {
                    if (key === 'RAZORPAY_KEY_ID' || key === 'RAZORPAY_KEY_SECRET') {
                        return '';
                    }
                    return 'test-value';
                }),
            };

            const moduleWithoutKeys: TestingModule = await Test.createTestingModule({
                providers: [
                    BillingService,
                    {
                        provide: ConfigService,
                        useValue: mockConfigWithoutKeys,
                    },
                    {
                        provide: UsersService,
                        useValue: {
                            update: jest.fn(),
                        },
                    },
                ],
            }).compile();

            const serviceWithoutKeys = moduleWithoutKeys.get<BillingService>(BillingService);

            await expect(serviceWithoutKeys.createRazorpayOrder(500)).rejects.toThrow(
                'Razorpay integration not configured'
            );
        });
    });

    describe('verifyRazorpayPayment', () => {
        it('should verify payment and upgrade user to Pro', async () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const userId = '507f1f77bcf86cd799439011';

            // Generate correct signature
            const crypto = require('crypto');
            const hmac = crypto.createHmac('sha256', 'test-razorpay-secret');
            hmac.update(`${orderId}|${paymentId}`);
            const signature = hmac.digest('hex');

            (usersService.update as jest.Mock).mockResolvedValue(createMockUser({ plan: 'pro' }));

            const result = await service.verifyRazorpayPayment(orderId, paymentId, signature, userId);

            expect(result.success).toBe(true);
            expect(usersService.update).toHaveBeenCalledWith(userId, {
                plan: 'pro',
                maxAiRuns: 1000,
                subscription: {
                    provider: 'razorpay',
                    id: paymentId,
                    status: 'active',
                },
            });
        });

        it('should reject payment with invalid signature', async () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const invalidSignature = 'invalid-signature';
            const userId = '507f1f77bcf86cd799439011';

            const result = await service.verifyRazorpayPayment(orderId, paymentId, invalidSignature, userId);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid signature');
            expect(usersService.update).not.toHaveBeenCalled();
        });
    });
});
