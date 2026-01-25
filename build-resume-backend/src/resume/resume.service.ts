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
    const newResume = new this.resumeModel(data);
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
    const updateData: any = { ...data };

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
