import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel('User') private userModel: Model<User>) { }

    async create(userData: Partial<User>): Promise<User> {
        const createdUser = new this.userModel(userData);
        return createdUser.save();
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).exec();
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        return this.userModel.findOne({ googleId }).exec();
    }

    // Assuming LinkedIn strategy provides an ID
    async findByLinkedinId(linkedinId: string): Promise<User | null> {
        return this.userModel.findOne({ linkedinId }).exec();
    }

    async update(id: string, updateData: Partial<User>): Promise<User | null> {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        }).exec();
    }

    async checkAndUpdateQuota(userId: string): Promise<{ authorized: boolean; remaining: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            return { authorized: false, remaining: 0 };
        }

        const now = new Date();
        const lastReset = user.lastQuotaReset ? new Date(user.lastQuotaReset) : new Date(0);

        // Reset quota if it's a new month
        if (
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear()
        ) {
            user.aiRunsThisMonth = 0;
            user.lastQuotaReset = now;
            await user.save();
        }

        const remaining = user.maxAiRuns - user.aiRunsThisMonth;

        if (remaining <= 0) {
            return { authorized: false, remaining: 0 };
        }

        return { authorized: true, remaining };
    }

    async incrementQuotaUsage(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            $inc: { aiRunsThisMonth: 1 }
        });
    }
}
