import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { PdfReader } from 'pdfreader';
import puppeteer from 'puppeteer-core';
import { OpenAIResponsesService } from '../shared/openai-responses.service';
const unirest = require("unirest")
const cheerio = require("cheerio")
const mammoth = require("mammoth");

@Injectable()
export class AnalyzeService {
  constructor(
    private configService: ConfigService,
    private openAIResponsesService: OpenAIResponsesService,
  ) { }

  async analyze(file: Express.Multer.File, jd: string, jobUrl: string) {
    console.log('--- STARTING ANALYSIS ---');
    console.log('Job URL:', jobUrl);
    console.log('JD Text (first 50 chars):', jd?.substring(0, 50));

    try {
      let resumeText = '';

      // 1. Resume Extraction
      if (file && file.mimetype === 'application/pdf') {
        console.log('[DEBUG] Extracting PDF:', file.originalname);
        resumeText = await this.extractTextFromPDF(file.buffer);
      } else if (file && (file.mimetype.includes('word') || file.originalname.endsWith('.docx'))) {
        console.log('[DEBUG] Extracting DOCX:', file.originalname);
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          resumeText = result.value;
        } catch (err) {
          console.error('[CRITICAL] DOCX extraction failed:', err);
          resumeText = '';
        }
      } else if (file) {
        console.log('[DEBUG] Extracting TXT:', file.originalname);
        resumeText = file.buffer.toString('utf8');
      }

      console.log('[DEBUG] Final Resume Text Length:', resumeText?.length || 0);
      if (resumeText) {
        console.log('[DEBUG] Resume Text (Start):', resumeText.substring(0, 500));
      }

      if (resumeText?.length < 50) {
        console.warn('[WARNING] Resume text is very short. Analysis might be inaccurate.');
      }

      // 2. JD Handling
      let structuredJD: any = null;
      const isUrl = jd?.trim().startsWith('http');

      if ((!jd || isUrl) && jobUrl) {
        console.log('[DEBUG] JD is a URL or empty, fetching actual content from:', jobUrl);
        // Optimization: Fetch raw text and use it directly to save one AI call (quota)
        const rawJD = await this.fetchJobDescription(jobUrl);

        if (!rawJD || rawJD.length < 50) {
          console.error('[ERROR] JD Fetch returned no content');
          return { error: 'Failed to fetch job description content from URL.' };
        }

        jd = rawJD;
        console.log('[DEBUG] Fetched Raw JD Text Length:', jd.length);
      }

      if (!jd || jd.length < 20) {
        console.error('Job Description is missing or too short.');
        return { error: 'Job description text is missing or could not be fetched.' };
      }

      // 3. LLM AI ANALYSIS
      console.log('Calling OpenRouter for analysis...');

      const prompt = `
        You are an expert ATS (Applicant Tracking System) and Career Coach. 
        Analyze the following Resume against the Job Description.

        Instructions:
        1. Be thorough and objective. Identify every missing skill and keyword.
        2. Provide actionable, specific resume improvements.
        3. Generate insightful interview topics and questions based on the gaps.
        4. Calculate a granular matchScore (0-100) based on how well the candidate's experience and skills align with the JD requirements. Avoid "safe" or default numbers like 33% or 50% unless truly warranted.
        5. Return ONLY pure JSON.
        6. Ensure all keys defined in the structure below are present in your response, even if the array is empty.

        JSON Structure:
        {
          "matchScore": number (0-100),
          "missingSkills": ["skill1", "skill2"],
          "missingKeywords": ["keyword1", "keyword2"],
          "resumeImprovements": ["improvement1", "improvement2"],
          "interviewTopics": ["topic1", "topic2"],
          "interviewQuestions": ["question1", "question2"]
        }

        Resume:
        ${resumeText}

        Job Description:
        ${jd}
      `;

      let analysis: any = {
        matchScore: 0,
        missingSkills: [],
        missingKeywords: [],
        resumeImprovements: [],
        interviewTopics: [],
        interviewQuestions: []
      };

      try {
        const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
        console.log('[DEBUG] OpenRouter Raw Response:', raw);
        console.log('[DEBUG] Raw Response Length:', raw?.length || 0);

        if (!raw || raw.length < 10) {
          console.error('[ERROR] OpenRouter returned empty or invalid response');
          throw new Error('Empty response from OpenRouter API');
        }

        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        console.log('[DEBUG] Cleaned Response:', cleaned.substring(0, 200));

        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr: any) {
          // Try to extract JSON from the response if it's wrapped in text
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`Failed to parse JSON: ${parseErr.message}`);
          }
        }

        console.log('[DEBUG] Parsed Analysis:', JSON.stringify(parsed, null, 2));

        // Robust Mapping (AI sometimes uses snake_case or slightly different names)
        analysis.matchScore = parsed.matchScore ?? parsed.match_score ?? 0;
        analysis.missingSkills = parsed.missingSkills ?? parsed.missing_skills ?? [];
        analysis.missingKeywords = parsed.missingKeywords ?? parsed.missing_keywords ?? [];
        analysis.resumeImprovements = parsed.resumeImprovements ?? parsed.resume_improvements ?? [];
        analysis.interviewTopics = parsed.interviewTopics ?? parsed.interview_topics ?? [];
        analysis.interviewQuestions = parsed.interviewQuestions ?? parsed.interview_questions ?? [];

        // Ensure matchScore is a valid number
        analysis.matchScore = Number(analysis.matchScore);
        if (isNaN(analysis.matchScore) || analysis.matchScore < 0) {
          analysis.matchScore = 0;
        }
        if (analysis.matchScore > 100) {
          analysis.matchScore = 100;
        }

        console.log('[DEBUG] Final Mapped Analysis:', JSON.stringify(analysis, null, 2));
        console.log('[DEBUG] Match Score:', analysis.matchScore);
      } catch (err: any) {
        console.error('[ERROR] OpenRouter Analysis Failed or Parse Error:', err);
        console.error('[ERROR] Error Stack:', err.stack);
        // Don't throw - return analysis with default values so user still gets some feedback
      }

      // 4. Advanced Embedding-based Matching
      console.log('Calculating embedding similarity...');
      try {
        const embeddingScore = await this.calculateSimilarity(resumeText, jd);
        console.log('Embedding Score:', embeddingScore);

        if (!isNaN(embeddingScore) && embeddingScore > 0) {
          // Blend the scores (e.g., 70% LLM, 30% Embedding) - increased LLM weight
          const llmScore = Number(analysis.matchScore) || 0;
          if (llmScore > 0) {
            analysis.matchScore = Math.round((llmScore * 0.7) + (embeddingScore * 100 * 0.3));
            console.log(`[DEBUG] Blended score - LLM: ${llmScore}, Embedding: ${embeddingScore}, Final: ${analysis.matchScore}`);
          } else {
            // If LLM score is 0, use embedding score as fallback
            analysis.matchScore = Math.round(embeddingScore * 100);
            console.log(`[DEBUG] Using embedding score as fallback: ${analysis.matchScore}`);
          }
        } else {
          console.warn('[DEBUG] Embedding score invalid or 0, using LLM score only');
        }
      } catch (e) {
        console.error('Embedding calculation failed:', e);
        // Continue with LLM score only
      }

      // Final Check - ensure we have a valid score
      if (isNaN(analysis.matchScore) || analysis.matchScore < 0) {
        console.warn('[WARNING] Invalid matchScore, defaulting to 0');
        analysis.matchScore = 0;
      }
      if (analysis.matchScore > 100) {
        analysis.matchScore = 100;
      }
      
      console.log('[DEBUG] Final matchScore after all processing:', analysis.matchScore);

      // 5. High Match Score Logic (>80%)
      if (analysis.matchScore > 80) {
        console.log('[BONUS] High Match Score detected (>80%). Generating specialized content...');
        try {
          const specialized = await this.generateSpecializedContent(resumeText, jd);
          analysis = { ...analysis, ...specialized };
        } catch (err) {
          console.error('[ERROR] Failed to generate specialized content:', err);
        }
      }

      analysis.jdText = jd; // Pass JD back for improvement flow
      console.log('Final Score:', analysis.matchScore);
      console.log('--- ANALYSIS COMPLETE ---');
      return analysis;

    } catch (fatalError) {
      console.error('FATAL ERROR DURING ANALYSIS:', fatalError);
      return {
        error: 'A fatal server error occurred during analysis.',
        details: fatalError.message
      };
    }
  }

  // Calculate similarity using TF-IDF (Embeddings)
  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const { TfidfUtil } = require('../shared/tfidf.util');
      const { score } = TfidfUtil.computeTFIDF(text1, text2);
      return score;
    } catch (e) {
      console.warn('[WARNING] Similarity calculation failed:', e);
      return 0;
    }
  }

  // New method to handle JD generation from URL
  async generateJD(url: string) {
    try {
      console.log('Generating JD for URL:', url);
      const rawText = await this.fetchJobDescription(url);
      console.log('Raw text length:', rawText?.length || 0);

      if (!rawText || rawText.length < 50) {
        console.warn('Scraping returned too little content.');
        return { error: 'Could not extract sufficient JD text from this URL.' };
      }

      return await this.structureJDWithAI(rawText);
    } catch (err) {
      console.error('Error in generateJD:', err);
      return { error: 'Failed to generate structured JD: ' + err.message };
    }
  }

  // Use AI to structure raw JD text
  private async structureJDWithAI(rawText: string) {
    console.log('Structuring JD with OpenRouter...');
    try {
      const prompt = `
        Extract the exact job details from the following raw text. 
        Return ONLY pure JSON with this structure:
        {
          "role": "string",
          "company": "string",
          "skills": ["string"],
          "responsibilities": ["string"],
          "qualifications": ["string"],
          "experience": "string",
          "fullDescription": "string"
        }

        Raw Text:
        ${rawText}
      `;

      const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.error('OpenRouter Structuring Error:', err);
      return {
        role: 'Unknown Role',
        company: 'Unknown Company',
        skills: [],
        fullDescription: rawText.substring(0, 5000)
      };
    }
  }

  // Extract text using pdfreader
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      let finalText = '';
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) reject(err);
        else if (!item) resolve(finalText);
        else if (item.text) finalText += item.text + ' ';
      });
    });
  }

  // 🌟 AUTO-DETECT platform & scrape accordingly
  async fetchJobDescription(url: string): Promise<string> {
    if (url.includes('linkedin.com')) return this.scrapeLinkedIn(url);
    if (url.includes('indeed.com')) return this.scrapeIndeed(url);
    if (url.includes('naukri.com')) return this.scrapeNaukri(url);
    if (url.includes('glassdoor.com')) return this.scrapeGlassdoor(url);

    // Fallback to generic scraper
    return this.genericScraper(url, ['main', 'article', '.job-description', '#job-description']);
  }

  // ---------------------------
  // LINKEDIN SCRAPER (Enhanced)
  // ---------------------------
  async scrapeLinkedIn(url: string): Promise<string> {
    try {
      // Vercel / Production Check: Puppeteer causes crashes/timeouts. Use Cheerio.
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.warn('[WARNING] Production/Vercel detected: Skipping Puppeteer for LinkedIn. Using Cheerio fallback.');
        return this.cheerioScrape(url);
      }

      // Local development only - use system Chrome
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
        executablePath,
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      console.log('[DEBUG] Page title:', await page.title());

      // Wait for content
      try {
        await page.waitForSelector('.show-more-less-html__markup, .description__text, main', { timeout: 15000 });
      } catch (err) {
        console.warn('[WARNING] Selector timeout on LinkedIn. Attempting fallback...');
      }

      const jd = await page.evaluate(() => {
        const selectors = [
          '.show-more-less-html__markup',
          '.jobs-description-content__text',
          '.description__text',
          'main'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.length > 200) {
            return (el as HTMLElement).innerText;
          }
        }
        return document.body.innerText; // Fallback to all text
      });

      await browser.close();
      return jd?.trim() || '';
    } catch (e) {
      console.error('LinkedIn JD Error:', e);
      return '';
    }
  }

  // ---------------------------
  // GENERIC SCRAPER
  // ---------------------------
  async genericScraper(url: string, selectors: string[]): Promise<string> {
    try {
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.log('[DEBUG] Using Cheerio for Generic Scraper (Production/Vercel)');
        return this.cheerioScrape(url);
      }
      
      // Local development only - use system Chrome
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath,
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const jd = await page.evaluate((selectors) => {
        // Try selectors first
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.length > 200) return (el as HTMLElement).innerText;
        }

        // If no selector matched, try to find the largest text block
        const bodyText = document.body.innerText;
        if (bodyText.length > 500) return bodyText;

        return '';
      }, selectors);

      await browser.close();
      return jd?.replace(/\s+/g, ' ').trim() || '';
    } catch {
      return '';
    }
  }

  // Implementations for Indeed, Naukri, Glassdoor can follow similar enhanced patterns if needed
  async scrapeIndeed(url: string): Promise<string> {
    return this.genericScraper(url, ['#jobDescriptionText', '.jobsearch-jobDescriptionText']);
  }

  async scrapeNaukri(url: string): Promise<string> {
    return this.genericScraper(url, ['.jd-description', 'section.job-desc']);
  }

  async scrapeGlassdoor(url: string): Promise<string> {
    return this.genericScraper(url, ['[data-test=jobDescriptionText]', '.job-description']);
  }

  // Helper to extract retry delay from API error response
  private extractRetryDelay(err: any): number | null {
    try {
      if (err.errorDetails && Array.isArray(err.errorDetails)) {
        for (const detail of err.errorDetails) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
            // Parse delay string like "55s" or "32.853827071s"
            const delayStr = detail.retryDelay;
            const seconds = parseFloat(delayStr.replace('s', ''));
            if (!isNaN(seconds) && seconds > 0) {
              return Math.ceil(seconds * 1000); // Convert to milliseconds
            }
          }
        }
      }
    } catch (e) {
      console.warn('[WARNING] Failed to extract retry delay from error:', e);
    }
    return null;
  }

  // Helper to check if quota is completely exhausted
  private isQuotaExhausted(err: any): boolean {
    try {
      if (err.errorDetails && Array.isArray(err.errorDetails)) {
        for (const detail of err.errorDetails) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure') {
            if (detail.violations && Array.isArray(detail.violations)) {
              // Check if any quota has limit: 0 (completely exhausted)
              return detail.violations.some((v: any) => {
                // Check quota metric names that indicate free tier exhaustion
                const metric = v.quotaMetric || '';
                return metric.includes('free_tier') &&
                  (metric.includes('requests') || metric.includes('token'));
              });
            }
          }
        }
      }
    } catch (e) {
      // If we can't parse, assume not exhausted
    }
    return false;
  }

  // Simplified scraper for environments where Puppeteer fails (like Vercel)
  private async cheerioScrape(url: string): Promise<string> {
    return new Promise((resolve) => {
      console.log('[CheerioScrape] Attempting to scrape:', url);
      
      unirest.get(url)
        .headers({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        })
        .timeout(15000) // Increased timeout to 15 seconds
        .end((res: any) => {
          if (res.error) {
            console.error('[CheerioScrape] Error or Timeout:', res.error);
            resolve('');
            return;
          }

          if (!res.body) {
            console.error('[CheerioScrape] No response body');
            resolve('');
            return;
          }

          try {
            const $ = cheerio.load(res.body);
            
            // LinkedIn-specific selectors
            if (url.includes('linkedin.com')) {
              const linkedinSelectors = [
                '.show-more-less-html__markup',
                '.jobs-description-content__text',
                '.description__text',
                '[data-test-id="job-posting-description"]',
                '.jobs-box__html-content',
              ];
              
              for (const selector of linkedinSelectors) {
                const text = $(selector).text();
                if (text && text.length > 200) {
                  console.log(`[CheerioScrape] Found LinkedIn content with selector: ${selector}, length: ${text.length}`);
                  resolve(text.trim());
                  return;
                }
              }
            }
            
            // Generic selectors
            const genericSelectors = [
              'main',
              'article',
              '.job-description',
              '#job-description',
              '#jobsearch-jobDescriptionText',
              '.jobsearch-jobDescriptionText',
              '[data-test="jobDescriptionText"]',
            ];
            
            for (const selector of genericSelectors) {
              const text = $(selector).text();
              if (text && text.length > 200) {
                console.log(`[CheerioScrape] Found content with selector: ${selector}, length: ${text.length}`);
                resolve(text.trim());
                return;
              }
            }
            
            // Last resort: all body text (limited)
            const bodyText = $('body').text();
            if (bodyText && bodyText.length > 200) {
              console.log(`[CheerioScrape] Using body text, length: ${bodyText.length}`);
              resolve(bodyText.substring(0, 10000).trim());
              return;
            }
            
            console.warn('[CheerioScrape] Could not extract sufficient content');
            resolve('');
          } catch (parseError: any) {
            console.error('[CheerioScrape] Parse error:', parseError);
            resolve('');
          }
        });
    });
  }

  // New: Generate specialized content for high-match candidates
  private async generateSpecializedContent(resume: string, jd: string) {
    const prompt = `
      The candidate has a very high match score (>80%) for this job.
      Generate the following additional content to help them stand out:
      1. A specialized version of the Job Description tailored to the candidate's specific skills and strengths.
      2. A highly customized Cover Letter that bridges their experience with the job requirements.
      3. A detailed Skill Alignment report showing exactly how their top skills map to the role.
      4. Recommendations for resume improvements to reach 100% match.

      Return ONLY pure JSON.
      Structure:
      {
        "specializedJD": "string (markdown)",
        "coverLetter": "string (markdown)",
        "skillAlignment": [{"skill": "string", "alignment": "high/medium/low", "reason": "string"}],
        "reach100Improvements": ["string"]
      }

      Resume:
      ${resume}

      Job Description:
      ${jd}
    `;

    try {
      const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Specialized Content Error:', err);
      return {};
    }
  }

  // New: Convert Resume to Structured JSON
  async parseResumeToJson(file: Express.Multer.File): Promise<any> {
    try {
      let resumeText = '';
      if (file.mimetype === 'application/pdf') {
        resumeText = await this.extractTextFromPDF(file.buffer);
      } else if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        resumeText = result.value;
      } else {
        resumeText = file.buffer.toString('utf8');
      }

      const prompt = `
        Convert the following Resume text into a highly structured JSON format.
        Schema:
        {
          "personalInfo": { "name": "", "email": "", "phone": "", "linkedin": "", "website": "" },
          "summary": "",
          "experience": [{ "role": "", "company": "", "location": "", "startDate": "", "endDate": "", "description": ["bullet points"], "skills": [] }],
          "education": [{ "degree": "", "school": "", "location": "", "year": "" }],
          "skills": { "technical": [], "soft": [], "tools": [] },
          "projects": [{ "name": "", "description": "", "technologies": [] }]
        }

        Resume Text:
        ${resumeText}
      `;

      const raw = await this.callWithRetry(() => this.openRouterCall(prompt));
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Resume Parsing Error:', err);
      return { error: 'Failed to parse resume to JSON.' };
    }
  }

  private async openRouterCall(prompt: string): Promise<string> {
    console.log('[DEBUG] Using OpenRouter API');
    try {
      return await this.openAIResponsesService.generateResponse(prompt, 'openai/gpt-4o');
    } catch (error: any) {
      console.error('[DEBUG] OpenRouter API Error:', error);
      throw error;
    }
  }

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
}
