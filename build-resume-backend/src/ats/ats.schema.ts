import { Schema, Document, Types } from 'mongoose';

export interface Job extends Document {
    title: string;
    description: string;
    company: string;
    location: string;
    recruiterId: string;
    createdAt: Date;
}

export const JobSchema = new Schema<Job>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    recruiterId: { type: String, required: true, index: true },
}, { timestamps: true });

export interface Application extends Document {
    jobId: Types.ObjectId;
    candidateName: string;
    candidateEmail: string;
    resumeText: string;
    score: number;
    matchAnalysis: string;
    missingSkills: string[];
    missingKeywords: string[];
    interviewQuestions: string[];
    ranking: number;
    recruiterId: string;
    createdAt: Date;
}

export const ApplicationSchema = new Schema<Application>({
    jobId: { type: Schema.Types.ObjectId as any, ref: 'Job', required: true, index: true },
    candidateName: { type: String },
    candidateEmail: { type: String },
    resumeText: { type: String },
    score: { type: Number, default: 0 },
    matchAnalysis: { type: String },
    missingSkills: [{ type: String }],
    missingKeywords: [{ type: String }],
    interviewQuestions: [{ type: String }],
    ranking: { type: Number },
    recruiterId: { type: String, required: true, index: true },
}, { timestamps: true });
