import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
const unirest = require("unirest");

// ❗ FIX: Correct pdfkit import
const PDFDocument = require('pdfkit');

@Injectable()
export class ImproveResumeService {
  constructor(
    private configService: ConfigService,
    private openAIResponsesService: OpenAIResponsesService,
  ) { }

  /**
   * Improves a raw resume buffer and returns a PDF
   */
  async improve(resumeBuffer: Buffer): Promise<Buffer> {
    console.log('[DEBUG] Improving resume via AI...');
    const prompt = `
      Improve the following resume text. Output only improved resume in plain text.
      
      Resume:
      ${resumeBuffer.toString()}
    `;

    try {
      const improvedText = await this.callWithRetry(() => this.aiCall(prompt));
      return this.buildPdf(improvedText);
    } catch (err) {
      console.error('AI Improvement Failed:', err);
      return this.buildPdf(resumeBuffer.toString());
    }
  }

  /**
   * Improves a specific section of the resume
   */
  async improveSection(sectionName: string, sectionContent: string, jdText?: string): Promise<string> {
    const prompt = `
      You are an expert resume writer. Improve the following "${sectionName}" section of a resume.
      ${jdText ? `Target Job Description: ${jdText}` : ''}
      
      Current Content:
      ${sectionContent}

      Instructions:
      1. Use strong action verbs.
      2. Quantify achievements where possible.
      3. Align with the provided JD keywords if available.
      4. Maintain professional tone.
      
      Return ONLY the improved section text (no markdown, no preamble).
    `;

    return await this.callWithRetry(() => this.aiCall(prompt));
  }

  /**
   * Generates arbitrary content based on a prompt (for frontend flexibility)
   */
  async generateContent(prompt: string): Promise<string> {
    console.log('[DEBUG] Generating arbitrary content via AI...');
    return await this.aiCall(prompt);
  }

  /**
   * Auto-suggests updates based on missing skills
   */
  async autoFillMissingSkills(resumeJson: any, missingSkills: string[], jdText: string) {
    const prompt = `
      Based on the candidate's existing experience and the job description, suggest where the missing skills could be incorporated.
      
      Missing Skills: ${missingSkills.join(', ')}
      Job Description: ${jdText}
      Resume (JSON): ${JSON.stringify(resumeJson)}

      Return a JSON object with suggested updates:
      {
        "suggestedUpdates": [
          { "section": "skills", "addition": "string" },
          { "section": "experience", "index": number, "newBullet": "string" }
        ]
      }
    `;

    const raw = await this.callWithRetry(() => this.aiCall(prompt));
    const cleaned = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
    const jsonMatch = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
  }

  /**
   * Complete AI-driven resume transformation
   */
  async fullAutoImprove(resumeFile: Express.Multer.File, jdText: string, missingSkills: string[], missingKeywords: string[]) {
    console.log('--- FULL AUTO-IMPROVE STARTING ---');
    try {
      const fs = require('fs');
      const mammoth = require('mammoth');
      const buffer = resumeFile.buffer || (resumeFile.path ? fs.readFileSync(resumeFile.path) : null);

      if (!buffer) throw new Error('File buffer is empty');

      let resumeText = '';
      if (resumeFile.mimetype === 'application/pdf') {
        resumeText = await this.extractTextFromPDF(buffer);
      } else if (resumeFile.mimetype.includes('word') || resumeFile.originalname?.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        resumeText = result.value;
      } else {
        resumeText = buffer.toString('utf8');
      }

      const prompt = `
        Transform this resume text into optimized JSON. 
        Job Description: ${jdText}
        Missing Skills: ${missingSkills.join(', ')}
        
        Resume: ${resumeText}

        Schema:
        {
          "firstName": "", "lastName": "", "email": "", "phone": "", "address": "", "jobTitle": "",
          "summery": "",
          "experience": [{ "title": "", "companyName": "", "city": "", "state": "", "startDate": "", "endDate": "", "currentlyWorking": false, "workSummery": "HTML list" }],
          "education": [{ "universityName": "", "degree": "", "major": "", "startDate": "", "endDate": "", "description": "" }],
          "skills": [{ "name": "", "rating": 5 }]
        }
      `;

      const raw = await this.callWithRetry(() => this.aiCall(prompt));
      let cleaned = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI failed to return JSON");

      let parsedData = JSON.parse(jsonMatch[0]);

      // Normalize experience data
      if (parsedData.experience) {
        parsedData.experience.forEach((exp: any) => {
          if (Array.isArray(exp.workSummery)) {
            exp.workSummery = '<ul>' + exp.workSummery.map(d => `<li>${d}</li>`).join('') + '</ul>';
          }
        });
      }

      // Normalize and Clamp Skills Rating (Mongoose schema max is 5)
      if (parsedData.skills && Array.isArray(parsedData.skills)) {
        parsedData.skills.forEach((skill: any) => {
          if (typeof skill.rating === 'number') {
            // Clamp between 1 and 5. If it's a 100-scale value, scale it down.
            if (skill.rating > 5) {
              skill.rating = Math.max(1, Math.min(5, Math.round(skill.rating / 20)));
            } else {
              skill.rating = Math.max(1, Math.min(5, Math.round(skill.rating)));
            }
          } else {
            skill.rating = 5; // Default if missing or malformed
          }
        });
      }

      return parsedData;
    } catch (err: any) {
      console.error('Full Auto-Improve Failed:', err);
      throw err;
    }
  }

  /**
   * Autofill helper using embeddings logic
   */
  async autofillWithEmbeddings(file: Express.Multer.File, jd: string) {
    try {
      const fs = require('fs');
      const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!buffer) throw new Error('File buffer is empty');

      const resumeText = file.mimetype === 'application/pdf'
        ? await this.extractTextFromPDF(buffer)
        : buffer.toString('utf8');

      const prompt = `
        Refine this resume to match the Job Description.
        Integrate keywords naturally.
        - Job Description: ${jd}
        - Resume: ${resumeText}

        Return ONLY pure JSON:
        {
          "firstName": "", "lastName": "", "email": "", "phone": "", "address": "", "jobTitle": "",
          "summery": "",
          "experience": [{ "title": "", "companyName": "", "city": "", "state": "", "startDate": "", "endDate": "", "currentlyWorking": false, "workSummery": "HTML list" }],
          "education": [{ "universityName": "", "degree": "", "major": "", "startDate": "", "endDate": "", "description": "" }],
          "skills": [{ "name": "", "rating": 5 }]
        }
      `;
      const raw = await this.aiCall(prompt);
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsedData = JSON.parse(match ? match[0] : cleaned);

      // Normalize Skills Rating
      if (parsedData.skills && Array.isArray(parsedData.skills)) {
        parsedData.skills.forEach((skill: any) => {
          if (typeof skill.rating === 'number') {
            if (skill.rating > 5) {
              skill.rating = Math.max(1, Math.min(5, Math.round(skill.rating / 20)));
            } else {
              skill.rating = Math.max(1, Math.min(5, Math.round(skill.rating)));
            }
          } else {
            skill.rating = 5;
          }
        });
      }

      return parsedData;
    } catch (err) {
      console.error('Autofill Embeddings Error:', err);
      throw err;
    }
  }

  // Helper: PDF text extraction
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const { PdfReader } = require('pdfreader');
    return new Promise((resolve, reject) => {
      let t = '';
      new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
        if (err) reject(err);
        else if (!item) resolve(t);
        else if (item.text) t += item.text + ' ';
      });
    });
  }

  // Helper: PDF Building
  private async buildPdf(text: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(11).text(text);
      doc.end();
    });
  }

  // Standard AI call
  private async aiCall(prompt: string): Promise<string> {
    return await this.openAIResponsesService.generateResponse(prompt);
  }

  // Standard Retry logic
  private async callWithRetry(fn: () => Promise<any>, retries = 2): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      }
    }
  }
}
