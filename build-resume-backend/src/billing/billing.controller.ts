import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @UseGuards(JwtAuthGuard)
    @Post('razorpay/order')
    async createOrder(@Body('amount') amount: number) {
        return this.billingService.createRazorpayOrder(amount);
    }

    @UseGuards(JwtAuthGuard)
    @Post('razorpay/verify')
    async verifyPayment(
        @Body('razorpay_order_id') orderId: string,
        @Body('razorpay_payment_id') paymentId: string,
        @Body('razorpay_signature') signature: string,
        @Request() req
    ) {
        return this.billingService.verifyRazorpayPayment(orderId, paymentId, signature, req.user.userId);
    }

    // PayPal endpoint removed
}
