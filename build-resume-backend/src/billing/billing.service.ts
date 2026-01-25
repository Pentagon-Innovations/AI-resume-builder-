import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
const Razorpay = require('razorpay');
const crypto = require('crypto');

@Injectable()
export class BillingService {
    private razorpay: any;
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private configService: ConfigService,
        private usersService: UsersService
    ) {
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

        if (keyId && keySecret && keyId !== '' && keySecret !== '') {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
            this.logger.log('Razorpay initialized successfully');
        } else {
            this.logger.warn('Razorpay keys are missing. Payment feature will be disabled.');
        }
    }

    async createRazorpayOrder(amount: number, currency: string = 'INR') {
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

        if (!keyId || !keySecret) {
            this.logger.error('Razorpay keys are missing in .env file');
            throw new Error('Razorpay integration not configured. Please add keys to .env');
        }

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency: currency,
            receipt: `receipt_${Date.now()}`,
        };
        try {
            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            this.logger.error('Razorpay Order Creation Failed', error);
            throw error;
        }
    }

    async verifyRazorpayPayment(orderId: string, paymentId: string, signature: string, userId: string) {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'));
        hmac.update(orderId + "|" + paymentId);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === signature) {
            // Payment successful, upgrade user to Pro
            await this.usersService.update(userId, {
                plan: 'pro',
                maxAiRuns: 1000, // Practically unlimited for pro
                subscription: {
                    provider: 'razorpay',
                    id: paymentId,
                    status: 'active'
                }
            });
            return { success: true };
        } else {
            return { success: false, message: 'Invalid signature' };
        }
    }

    // VerifyPaypalPayment removed

}
