import { Schema, Document } from 'mongoose';

// Define the Education interface
export interface Education {
  universityName: string;
  degree: string;
  major: string;
  startDate: Date;
  endDate?: Date | null; // Optional, allows null for ongoing education
  description: string;
}

// Define the Experience interface
export interface Experience {
  title: string;
  companyName: string;
  city: string;
  state: string;
  startDate: Date;
  endDate?: Date | null; // Optional, allows null for ongoing jobs
  description: string; // Renamed for consistency with Education
}

// Define the Skill interface
export interface Skill {
  name: string;
  rating: number;
}

// Define the Resume interface
export interface Resume extends Document {
  title?: string;
  userEmail: string;
  userName?: string;
  address?: string;
  email?: string;
  firstName?: string;
  jobTitle?: string;
  lastName?: string;
  phone?: string;
  summery?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  templateType?: number;
  profilePhoto?: {
    data: Buffer;
    contentType: string;
  };
  profilePhotoBase64?: string;
}

// Define a sub-schema for Skills
const SkillSchema = new Schema<Skill>({
  name: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // Validate rating
});

// Define a sub-schema for Education
const EducationSchema = new Schema<Education>({
  universityName: { type: String, required: false, trim: true },
  degree: { type: String, required: false, trim: true },
  major: { type: String, required: false, trim: true },
  startDate: { type: Date, required: false }, // Relaxed
  endDate: { type: Date, default: null },
  description: { type: String, required: false, trim: true }, // Relaxed
});

// Define a sub-schema for Experience
const ExperienceSchema = new Schema<Experience>({
  title: { type: String, required: false, trim: true },
  companyName: { type: String, required: false, trim: true },
  city: { type: String, required: false, trim: true }, // Relaxed
  state: { type: String, required: false, trim: true }, // Relaxed
  startDate: { type: Date, required: false }, // Relaxed
  endDate: { type: Date, default: null },
  description: { type: String, required: false, trim: true }, // Relaxed
});

// Define the Resume schema
export const ResumeSchema = new Schema<Resume>(
  {
    title: { type: String, trim: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    userName: { type: String, trim: true },
    address: { type: String, trim: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    firstName: { type: String, required: false, trim: true },
    jobTitle: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    phone: { type: String, trim: true },
    summery: { type: String, trim: true },
    experience: { type: [ExperienceSchema], default: [] }, // Ensures empty array instead of undefined
    education: { type: [EducationSchema], default: [] },
    skills: { type: [SkillSchema], default: [] },
    templateType: { type: Number, default: 1 }, // Default template type
    profilePhoto: {
      data: { type: Buffer },
      contentType: { type: String, trim: true },
    },
    profilePhotoBase64: { type: String },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt
);
