import { Test, TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { getModelToken } from '@nestjs/mongoose';
import { createMockResume, createMockFile } from '../test/test-utils';

describe('ResumeService', () => {
  let service: ResumeService;
  let mockResumeModel: any;

  beforeEach(async () => {
    mockResumeModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439012' }),
    }));

    (mockResumeModel as any).create = jest.fn();
    (mockResumeModel as any).find = jest.fn();
    (mockResumeModel as any).findById = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    });
    (mockResumeModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    (mockResumeModel as any).findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        {
          provide: getModelToken('Resume'),
          useValue: mockResumeModel,
        },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewResume', () => {
    it('should create a new resume', async () => {
      const resumeData = {
        userEmail: 'test@example.com',
        title: 'My Resume',
      };

      const mockResume = createMockResume(resumeData);
      // The constructor mock is already set in beforeEach to return a mock with .save()

      const result = await service.createNewResume(resumeData);

      expect(result).toBeDefined();
      expect(result.title).toBe(resumeData.title);
    });
  });

  describe('getUserResumes', () => {
    it('should return all resumes for a user', async () => {
      const mockResumes = [createMockResume(), createMockResume({ title: 'Resume 2' })];
      mockResumeModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResumes),
      });

      const result = await service.getUserResumes('test@example.com');

      expect(result).toEqual(mockResumes);
      expect(mockResumeModel.find).toHaveBeenCalledWith({ userEmail: 'test@example.com' });
    });
  });

  describe('getResumeById', () => {
    it('should return resume by ID', async () => {
      const mockResume = createMockResume();
      mockResumeModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResume),
      });

      const result = await service.getResumeById('507f1f77bcf86cd799439012');

      expect(result).toEqual(mockResume);
    });

    it('should return null if resume not found', async () => {
      mockResumeModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getResumeById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateResumeDetail', () => {
    it('should update resume without photo', async () => {
      const updates = { title: 'Updated Resume' };
      const updatedResume = createMockResume(updates);

      mockResumeModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedResume),
      });

      const result = await service.updateResumeDetail('507f1f77bcf86cd799439012', updates);

      expect(result).toEqual(updatedResume);
    });

    it('should update resume with photo', async () => {
      const updates = { title: 'Updated Resume' };
      const mockFile = createMockFile();
      const updatedResume = createMockResume(updates);

      mockResumeModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedResume),
      });

      const result = await service.updateResumeDetail('507f1f77bcf86cd799439012', updates, mockFile);

      expect(result).toEqual(updatedResume);
      expect(mockResumeModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteResumeById', () => {
    it('should delete resume', async () => {
      const mockResume = createMockResume();
      mockResumeModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResume),
      });

      const result = await service.deleteResumeById('507f1f77bcf86cd799439012');

      expect(result).toEqual(mockResume);
    });
  });

  describe('getProfilePhoto', () => {
    it('should return profile photo', async () => {
      const mockResume = createMockResume({
        profilePhoto: {
          data: Buffer.from('photo data'),
          contentType: 'image/jpeg',
        },
      });

      // Update mock for this specific test
      mockResumeModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockResume),
      });

      const result = await service.getProfilePhoto('507f1f77bcf86cd799439012');

      expect(result).toEqual((mockResume as any).profilePhoto);
    });
  });
});
