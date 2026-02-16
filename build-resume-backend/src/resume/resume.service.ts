import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, Education, Experience, Skill } from './resume.schema';
import { Buffer } from 'buffer';

interface UpdateResumeData {
  title?: string;
  userEmail?: string;
  userName?: string;
  address?: string;
  email?: string;
  firstName?: string;
  jobTitle?: string;
  lastName?: string;
  phone?: string;
  summery?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  templateType?: number;
  profilePhoto?: {
    data: Buffer;
    contentType: string;
  };
}

@Injectable()
export class ResumeService {
  constructor(
    @InjectModel('Resume') private readonly resumeModel: Model<Resume>,
  ) { }

  async createNewResume(data: Partial<Resume>): Promise<Resume> {
    const normalizedData = this.normalizeResumeData(data);
    const newResume = new this.resumeModel(normalizedData);
    return newResume.save();
  }

  async getUserResumes(userEmail: string): Promise<Resume[]> {
    return this.resumeModel.find({ userEmail }).exec();
  }

  async updateResumeDetail(
    id: string,
    data: UpdateResumeData,
    file?: Express.Multer.File, // Handle uploaded file correctly
  ): Promise<Resume | null> {
    const updateData: any = this.normalizeResumeData({ ...data });

    if (file) {
      updateData.profilePhoto = {
        data: file.buffer,
        contentType: file.mimetype,
      };
    }

    return this.resumeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  /**
   * Defensive normalization to prevent Mongoose validation errors
   * from AI-generated or malformed client-side data.
   */
  private normalizeResumeData(data: any): any {
    if (!data) return data;

    // 1. Fallback for Title and Name
    if (!data.title) {
      data.title = 'Untitled Resume';
    }
    if (data.firstName) data.firstName = data.firstName.trim();
    if (data.lastName) data.lastName = data.lastName.trim();

    // 2. Email and Phone Normalization
    if (data.userEmail) data.userEmail = data.userEmail.toLowerCase().trim();
    if (data.email) data.email = data.email.toLowerCase().trim();
    if (data.phone) data.phone = data.phone.trim();

    // 3. Normalize Skills: Rating (1-5) and De-duplicate by name
    if (data.skills && Array.isArray(data.skills)) {
      const uniqueSkills = new Map();

      data.skills.forEach((skill: any) => {
        if (typeof skill === 'object' && skill !== null && skill.name) {
          const name = skill.name.trim();
          if (!name) return;

          let rating = Number(skill.rating);
          if (isNaN(rating)) rating = 3; // Default to mid-range if missing

          // Clamp to 1-5. If it's 100-scale, scale down.
          if (rating > 5) {
            rating = Math.max(1, Math.min(5, Math.round(rating / 20)));
          } else {
            rating = Math.max(1, Math.min(5, Math.round(rating)));
          }

          // Keep the highest rating if duplicate name
          if (!uniqueSkills.has(name) || rating > uniqueSkills.get(name).rating) {
            uniqueSkills.set(name, { ...skill, name, rating });
          }
        }
      });
      data.skills = Array.from(uniqueSkills.values());
    }

    // 3. Normalize Experience: Property Names, Dates, and "Currently Working" state
    if (data.experience && Array.isArray(data.experience)) {
      data.experience = data.experience.map((exp: any) => {
        // Handle property name mismatch
        if (exp.workSummery && !exp.description) {
          exp.description = exp.workSummery;
          delete exp.workSummery;
        }

        // Handle Array to HTML conversion
        if (Array.isArray(exp.description)) {
          exp.description = '<ul>' + exp.description.map(d => `<li>${d}</li>`).join('') + '</ul>';
        }

        const isCurrent = exp.currentlyWorking === true ||
          exp.endDate === 'Present' ||
          (typeof exp.endDate === 'string' && ['present', 'current', 'now', 'ongoing', 'till date'].includes(exp.endDate.toLowerCase().trim()));

        if (isCurrent) {
          exp.endDate = null;
        }

        return exp;
      });
    }

    // 4. Normalize Education Dates and Descriptions
    if (data.education && Array.isArray(data.education)) {
      data.education = data.education.map((edu: any) => {
        // Handle Array to HTML conversion
        if (Array.isArray(edu.description)) {
          edu.description = '<ul>' + edu.description.map(d => `<li>${d}</li>`).join('') + '</ul>';
        }

        const isCurrent = edu.endDate === 'Present' ||
          (typeof edu.endDate === 'string' && ['present', 'current', 'now', 'ongoing'].includes(edu.endDate.toLowerCase().trim()));

        if (isCurrent) {
          edu.endDate = null;
        }
        return edu;
      });
    }

    return data;
  }

  async getProfilePhoto(id: string) {
    const resume = await this.resumeModel.findById(id).select('profilePhoto').exec();
    if (!resume || !resume.profilePhoto) {
      throw new Error('Photo not found');
    }
    return resume.profilePhoto;
  }

  async getResumeById(id: string): Promise<Resume | null> {
    return this.resumeModel.findById(id).exec();
  }

  async deleteResumeById(id: string): Promise<Resume | null> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid resume ID provided');
    }
    return this.resumeModel.findByIdAndDelete(id).exec();
  }
}
