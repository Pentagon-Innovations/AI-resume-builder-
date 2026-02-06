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

    // 1. Normalize Skills Rating (Mongoose max: 5)
    if (data.skills && Array.isArray(data.skills)) {
      data.skills = data.skills.map((skill: any) => {
        if (typeof skill === 'object' && skill !== null) {
          let rating = Number(skill.rating);
          if (isNaN(rating)) rating = 5;

          // Clamp to 1-5. If it's a 100-scale value (common AI hallucination), scale down.
          if (rating > 5) {
            rating = Math.max(1, Math.min(5, Math.round(rating / 20)));
          } else {
            rating = Math.max(1, Math.min(5, Math.round(rating)));
          }

          return { ...skill, rating };
        }
        return skill;
      });
    }

    // 2. Normalize Property Names (description vs workSummery)
    if (data.experience && Array.isArray(data.experience)) {
      data.experience = data.experience.map((exp: any) => {
        if (exp.workSummery && !exp.description) {
          exp.description = exp.workSummery;
          delete exp.workSummery;
        }
        return exp;
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
