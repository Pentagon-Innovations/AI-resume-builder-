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

  async improve(resumeBuffer: Buffer) {
    console.log('Improving resume with OpenRouter...');
    const prompt = `
      Improve the following resume text. Output only improved resume in plain text.
      
      Resume:
      ${resumeBuffer.toString()}
    `;

    try {
      const improvedText = await this.callWithRetry(() => this.openRouterCall(prompt));
      return this.buildPdf(improvedText);
    } catch (err) {
      console.error('OpenRouter Improvement Failed:', err);
      return this.buildPdf(resumeBuffer.toString());
    }
  }

  // New: Section-wise editing
  async improveSection(sectionName: string, sectionContent: string, jdText?: string) {
    const prompt = `
      Improve the following "${sectionName}" section of a resume.
      ${jdText ? `Target Job Description: ${jdText}` : ''}
      
      Current Content:
      ${sectionContent}

      Instructions:
      1. Use strong action verbs.
      2. Quantify achievements where possible.
      3. Align with the provided JD keywords if available.
      4. Maintain professional tone.
      
      Return ONLY the improved section text.
    `;

    return await this.callWithRetry(() => this.openRouterCall(prompt));
  }

  // New: Auto-fill missing skills and experience
  async autoFillMissingSkills(resumeJson: any, missingSkills: string[], jdText: string) {
    const prompt = `
      Based on the candidate's existing experience and the job description, suggest where the missing skills could be incorporated or if the candidate might already have them but hasn't highlighted them well.
      
      Missing Skills: ${missingSkills.join(', ')}
      Job Description: ${jdText}
      Resume (JSON): ${JSON.stringify(resumeJson)}

      Return a JSON object with suggested updates for specific sections:
      {
        "suggestedUpdates": [
          { "section": "skills", "addition": "string" },
          { "section": "experience", "index": number, "newBullet": "string" }
        ]
      }
    `;

    const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  // New: Combined Auto-Improve (JSON output)
  async fullAutoImprove(resumeFile: Express.Multer.File, jdText: string, missingSkills: string[], missingKeywords: string[]) {
    console.log('--- FULL AUTO-IMPROVE STARTING ---');
    try {
      // 1. Get Resume Text
      console.log(`[SERVICE] Processing file: ${resumeFile.originalname}, Mime: ${resumeFile.mimetype}, Size: ${resumeFile.size}, Buffer: ${!!resumeFile.buffer}, Path: ${resumeFile.path}`);
      let resumeText = '';
      const fs = require('fs');
      const mammoth = require('mammoth');

      // Handle both buffer (memory) and path (disk) uploads
      const buffer = resumeFile.buffer || (resumeFile.path ? fs.readFileSync(resumeFile.path) : null);

      if (!buffer) {
        throw new Error('File buffer is empty. Upload failed.');
      }

      if (resumeFile.mimetype === 'application/pdf') {
        resumeText = await this.extractTextFromPDF(buffer);
      } else if (resumeFile.mimetype.includes('word') || resumeFile.originalname?.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: buffer });
        resumeText = result.value;
      } else {
        resumeText = buffer.toString('utf8');
      }

      // 2. Comprehensive Prompt for Structured Improved Resume
      const prompt = `
        You are a world-class Resume Optimization Engine. 
        Analyze the following Resume against the Job Description and the identified gaps.
        
        Task:
        1. Convert the resume into a highly structured JSON format.
        2. Automatically improve bullet points using strong action verbs and quantifying achievements.
        Your task is to:
        1. Extract the candidate's existing information from the Resume Text.
        2. Optimize and improve the content ONLY IF the information exists. DO NOT Hallucinate or make up false information.
        3. If a field like 'address', 'phone', or 'description' is missing in the resume and you cannot infer it, set it to an empty string ("") or null.
        4. In the 'experience' section, improve bullet points if they exist. If a job has no description, leave it empty.
        5. In the 'summery' section, write a professional summary.

        Data Inputs:
        - Job Description: ${jdText}
        - Missing Skills: ${missingSkills.join(', ')}
        - Missing Keywords: ${missingKeywords.join(', ')}
        - Original Resume: ${resumeText}

        Return ONLY pure JSON with this schema format (no markdown code blocks):
        {
          "firstName": "string",
          "lastName": "string",
          "email": "string",
          "phone": "string",
          "address": "string",
          "jobTitle": "string",
          "summery": "AI-optimized professional summary",
          "experience": [{
            "title": "string",
            "companyName": "string",
            "city": "string (or empty)",
            "state": "string (or empty)",
            "startDate": "YYYY-MM-DD (or empty string if not found)",
            "endDate": "YYYY-MM-DD or null",
            "description": "HTML formatted bullet points (<ul><li>) OR empty string"
          }],
          "education": [{
            "universityName": "string",
            "degree": "string",
            "major": "string",
            "startDate": "YYYY-MM-DD (or empty string)",
            "endDate": "YYYY-MM-DD (or empty string) or null",
            "description": "string (or empty string)"
          }],
          "skills": [{ "name": "string", "rating": number 1-5 }]
        }
      `;

      const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
      // Robust JSON cleaning and extracting
      let cleaned = raw.trim();

      // Remove markdown code blocks if present
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      // Find JSON object - try to match the outermost JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in LLM response. Response: " + cleaned.substring(0, 200));
      }

      cleaned = jsonMatch[0];

      // Fix common JSON issues before parsing
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      let parsedData;
      try {
        parsedData = JSON.parse(cleaned);
      } catch (parseError: any) {
        console.warn('Initial JSON parse failed, attempting to fix...', parseError.message);
        cleaned = cleaned.replace(/([{,]\s*"[^"]*":\s*")([^"]*)"([^"]*")/g, (match, prefix, middle, suffix) => {
          const escapedMiddle = middle.replace(/"/g, '\\"');
          return prefix + escapedMiddle + suffix;
        });

        try {
          parsedData = JSON.parse(cleaned);
        } catch (secondError: any) {
          throw new Error(`Failed to parse JSON from LLM response: ${parseError.message}`);
        }
      }

      // Validate Dates and Normalize Descriptions
      if (parsedData.experience) {
        parsedData.experience.forEach((exp: any) => {
          // Flatten array description to HTML list
          if (Array.isArray(exp.description)) {
            exp.description = '<ul>' + exp.description.map(d => `<li>${d}</li>`).join('') + '</ul>';
          }

          if (exp.startDate && isNaN(Date.parse(exp.startDate))) exp.startDate = '';
          if (exp.endDate && isNaN(Date.parse(exp.endDate))) exp.endDate = null;
        });
      }
      if (parsedData.education) {
        parsedData.education.forEach((edu: any) => {
          // Flatten array description to string
          if (Array.isArray(edu.description)) {
            edu.description = edu.description.join('. ');
          }

          if (edu.startDate && isNaN(Date.parse(edu.startDate))) edu.startDate = '';
          if (edu.endDate && isNaN(Date.parse(edu.endDate))) edu.endDate = null;
        });
      }

      // 🛑 CRITICAL FIX: Ensure skills are mapped correctly for the frontend
      // The frontend likely expects skills as { name, rating, id? } but let's stick to schema
      // Just ensure we return the parsed data directly.

      return parsedData;

    } catch (err: any) {
      console.error('Full Auto-Improve Failed:', err);
      throw new Error(err.message || 'Failed to fully improve resume automatically.');
    }
  }

  // Extract text using pdfreader (Helper)
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const { PdfReader } = require('pdfreader');
    return new Promise((resolve, reject) => {
      let finalText = '';
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) reject(err);
        else if (!item) resolve(finalText);
        else if (item.text) finalText += item.text + ' ';
      });
    });
  }

  private buildPdf(text: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(12).text(text);
      doc.end();
    });
  }

  private async openRouterCall(prompt: string): Promise<string> {
    console.log('[DEBUG] Using OpenRouter API (Improve)');
    try {
      return await this.openAIResponsesService.generateResponse(prompt, 'openai/gpt-4o');
    } catch (error: any) {
      console.error('[DEBUG] OpenRouter API Error:', error);
      throw error;
    }
  }

  // Helper to retry calls on 429
  private async callWithRetry(fn: () => Promise<any>, retries = 3, baseDelay = 2000): Promise<any> {
    try {
      return await fn();
    } catch (err: any) {
      if (err.status === 429 && retries > 0) {
        console.warn(`[RATE LIMIT] 429 hit. Retrying in ${Math.round(baseDelay / 1000)}s... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, baseDelay));
        return this.callWithRetry(fn, retries - 1, baseDelay * 2);
      }
      throw err;
    }
  }
  // NEW: Autofill Resume using Embeddings (TF-IDF) + LLM
  async autofillWithEmbeddings(file: Express.Multer.File, jd: string) {
    console.log('--- STARTING AUTOFILL WITH EMBEDDINGS ---');
    try {
      const fs = require('fs');
      const mammoth = require('mammoth');
      const { TfidfUtil } = require('../shared/tfidf.util');

      // 1. Extract Resume Text
      let resumeText = '';
      const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);

      if (!buffer) {
        throw new Error('File buffer is empty. Upload failed.');
      }

      if (file.mimetype === 'application/pdf') {
        resumeText = await this.extractTextFromPDF(buffer);
      } else if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: buffer });
        resumeText = result.value;
      } else {
        resumeText = buffer.toString('utf8');
      }

      // 2. Compute Embeddings & Missing Keywords
      console.log('Computing TF-IDF Embeddings...');
      const { missingKeywords } = TfidfUtil.computeTFIDF(resumeText, jd);
      console.log('Identified Missing Keywords:', missingKeywords);

      // 3. Generate Structured Resume
      const prompt = `
        You are an expert Resume Writer.
        Create a tailored resume for the candidate based on their existing resume and the target Job Description.
        
        CRITICAL INSTRUCTION:
        Integrate the following MISSING KEYWORDS naturally into the resume content (summary, experience, skills):
        ${missingKeywords.join(', ')}

        Job Description:
        ${jd}

        Original Resume:
        ${resumeText}

        Return ONLY pure JSON matching this exact schema (no markdown code blocks):
        {
          "firstName": "string",
          "lastName": "string",
          "email": "string",
          "phone": "string",
          "address": "string",
          "jobTitle": "string",
          "summery": "string",
          "experience": [{
            "title": "string",
            "companyName": "string",
            "city": "string",
            "state": "string",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD",
            "description": "HTML list <ul><li>...</li></ul> with keywords integrated"
          }],
          "education": [{
            "universityName": "string",
            "degree": "string",
            "major": "string",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD",
            "description": "string"
          }],
          "skills": [{ "name": "string", "rating": 5 }]
        }
      `;

      const raw = await this.callWithRetry(() => this.openRouterCall(prompt));

      // Robust JSON cleaning and extracting
      let cleaned = raw.trim();

      // Remove markdown code blocks if present
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      // Find JSON object - try to match the outermost JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in LLM response. Response: " + cleaned.substring(0, 200));
      }

      cleaned = jsonMatch[0];

      // Fix common JSON issues before parsing
      // Remove trailing commas before closing braces/brackets
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      // Try to parse the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(cleaned);
      } catch (parseError: any) {
        // If parsing fails, try to fix common issues
        console.warn('Initial JSON parse failed, attempting to fix...', parseError.message);

        // Try to fix unescaped quotes in string values
        // This is a simplified fix - for production, consider a more robust JSON repair library
        cleaned = cleaned.replace(/([{,]\s*"[^"]*":\s*")([^"]*)"([^"]*")/g, (match, prefix, middle, suffix) => {
          // Escape quotes in the middle part
          const escapedMiddle = middle.replace(/"/g, '\\"');
          return prefix + escapedMiddle + suffix;
        });

        try {
          parsedData = JSON.parse(cleaned);
        } catch (secondError: any) {
          throw new Error(`Failed to parse JSON from LLM response. Parse error: ${parseError.message}. Response preview: ${cleaned.substring(0, 500)}`);
        }
      }

      // Validate Dates
      if (parsedData.experience) {
        parsedData.experience.forEach((exp: any) => {
          if (exp.startDate && isNaN(Date.parse(exp.startDate))) exp.startDate = '';
          if (exp.endDate && isNaN(Date.parse(exp.endDate))) exp.endDate = null;
        });
      }
      if (parsedData.education) {
        parsedData.education.forEach((edu: any) => {
          if (edu.startDate && isNaN(Date.parse(edu.startDate))) edu.startDate = '';
          if (edu.endDate && isNaN(Date.parse(edu.endDate))) edu.endDate = null;
        });
      }

      return parsedData;

    } catch (err: any) {
      console.error('Autofill Failed:', err);
      // Throw error instead of returning error object
      throw new Error(err.message || 'Failed to autofill resume. ' + JSON.stringify(err));
    }
  }
}

