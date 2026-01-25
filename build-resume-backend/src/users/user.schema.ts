import { Schema, Document } from 'mongoose';

export interface User extends Document {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    linkedinId?: string;
    refreshToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    picture?: string;
    role: 'user' | 'recruiter' | 'admin';
    plan: 'free' | 'pro';
    aiRunsThisMonth: number;
    maxAiRuns: number;
    lastQuotaReset: Date;
    subscription?: {
        provider: 'razorpay' | 'paypal';
        id: string;
        status: string;
    };
}

export const UserSchema = new Schema<User>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String }, // Optional for OAuth users
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, trim: true },
        googleId: { type: String, unique: true, sparse: true },
        linkedinId: { type: String, unique: true, sparse: true },
        refreshToken: { type: String, select: false },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        picture: { type: String },
        role: { type: String, enum: ['user', 'recruiter', 'admin'], default: 'user' },
        plan: { type: String, enum: ['free', 'pro'], default: 'free' },
        aiRunsThisMonth: { type: Number, default: 0 },
        maxAiRuns: { type: Number, default: 15 },
        lastQuotaReset: { type: Date, default: Date.now },
        subscription: {
            provider: { type: String, enum: ['razorpay', 'paypal'] },
            id: { type: String },
            status: { type: String }
        }
    },
    { timestamps: true },
);
