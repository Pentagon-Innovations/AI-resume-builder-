import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Return safe user details
        return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            plan: user.plan,
            aiRunsThisMonth: user.aiRunsThisMonth,
            maxAiRuns: user.maxAiRuns,
            picture: user.picture
        };
    }
}
