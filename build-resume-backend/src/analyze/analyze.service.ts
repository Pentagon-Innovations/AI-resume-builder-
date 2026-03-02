import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
// import { PdfReader } from 'pdfreader'; // MOVED INLINE
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
        console.log('[DEBUG] Resume Text (End):', resumeText.substring(resumeText.length - 200));
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
      console.log('Calling AI for analysis...');

      const prompt = `
        You are a highly advanced ATS (Applicant Tracking System) engine and Senior Technical Career Coach.

        Your task is to deeply analyze the provided Resume against the Job Description with strict, objective evaluation criteria.

        CRITICAL RULES:
        - Be precise, technical, and exhaustive.
        - Do NOT hallucinate skills that are not explicitly present in the resume.
        - Only consider explicitly stated skills, technologies, tools, frameworks, certifications, and quantified achievements.
        - If a technology appears anywhere in the resume (experience, projects, or skills section), count it as present.
        - Return ONLY valid JSON. No explanations. No markdown. No extra text.

        ----------------------------------------
        EVALUATION INSTRUCTIONS
        ----------------------------------------

        1. Technical Skill Gap Analysis
           - Identify ALL missing required technologies.
           - Separate clearly between:
             a) Missing hard skills
             b) Missing tools/platforms
             c) Missing methodologies
           - Be extremely strict about core stack alignment.

        2. Keyword & ATS Optimization
           - Extract high-value ATS keywords from the Job Description.
           - Identify which important keywords are absent from the resume.
           - Focus on exact keyword matches (e.g., "REST APIs" vs "API development").

        3. Experience Alignment
           - Evaluate:
             - Years of experience alignment
             - Domain alignment
             - Seniority level match
             - Project complexity relevance
           - Penalize heavily if required experience level is missing.

        4. Match Score Calculation (0–100)
           Score must be calculated as follows:
           - 50% Core Technical Stack Match
           - 20% Supporting Tools & Ecosystem
           - 15% Experience Level Alignment
           - 10% Domain / Industry Relevance
           - 5% ATS Keyword Coverage

           Score Interpretation:
           - 90–100 → Exceptional fit (near perfect technical & experience overlap)
           - 70–89  → Strong fit (minor non-core gaps)
           - 40–69  → Moderate fit (clear core skill gaps)
           - 0–39   → Weak fit (minimal alignment)

           IMPORTANT:
           - If ALL essential technologies are present (even if only in skills section), score must be >= 85.
           - If more than 50% of required core technologies are missing, score must be <= 60.

        5. Resume Improvements (Actionable)
           - Provide specific bullet rewrites.
           - Suggest quantified impact statements.
           - Suggest missing keywords to insert naturally.
           - Recommend restructuring if needed.
           - Suggest technical depth additions where weak.

        6. Interview Preparation
           - Generate targeted interview topics based ONLY on missing or weak areas.
           - Provide challenging technical questions tied directly to the gaps.
           - Questions should test practical, real-world knowledge.

        ----------------------------------------
        OUTPUT FORMAT (STRICT JSON ONLY)
        ----------------------------------------

        {
          "matchScore": number,
          "coreSkillMatchPercentage": number,
          "experienceAlignmentScore": number,
          "missingHardSkills": ["skill1", "skill2"],
          "missingToolsAndPlatforms": ["tool1", "tool2"],
          "missingMethodologies": ["methodology1"],
          "missingKeywords": ["keyword1", "keyword2"],
          "resumeImprovements": [
            "Specific rewrite suggestion 1",
            "Specific rewrite suggestion 2"
          ],
          "interviewTopics": ["topic1", "topic2"],
          "interviewQuestions": [
            "Technical question 1",
            "Technical question 2"
          ]
        }

        Resume:
        ${resumeText}

        Job Description:
        ${jd}
      `;

      let analysis: any = {
        matchScore: 0,
        coreSkillMatchPercentage: 0,
        experienceAlignmentScore: 0,
        missingHardSkills: [],
        missingToolsAndPlatforms: [],
        missingMethodologies: [],
        missingKeywords: [],
        resumeImprovements: [],
        interviewTopics: [],
        interviewQuestions: [],
        jdText: jd,
        diagnostics: {
          resumeLength: resumeText?.length || 0,
          jdLength: jd?.length || 0,
          hasFile: !!file,
          fileType: file?.mimetype || 'none'
        }
      };

      try {
        const raw = await this.callWithRetry(() => this.aiCall(prompt));
        console.log('[DEBUG] AI Raw Response Length:', typeof raw === 'string' ? raw.length : 'Object');

        if (!raw) {
          console.error('[ERROR] AI returned empty or invalid response');
          throw new Error('Empty response from AI API');
        }

        const cleaned = typeof raw === 'string'
          ? raw.replace(/```json/gi, '').replace(/```/g, '').trim()
          : JSON.stringify(raw);

        console.log('[DEBUG] AI Response (Cleaned Snippet):', cleaned.substring(0, 150));

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr: any) {
          console.warn('[WARNING] JSON.parse failed, trying regex match...');
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (innerErr: any) {
              console.error('[ERROR] Regex JSON extraction failed:', innerErr.message);
              throw innerErr;
            }
          } else {
            throw new Error(`Failed to parse JSON: ${parseErr.message}`);
          }
        }

        // Robust Mapping (Handles both user's high-precision keys and potential AI variations)
        analysis.matchScore = parsed.matchScore ?? parsed.match_score ?? parsed.score ?? 0;
        analysis.coreSkillMatchPercentage = parsed.coreSkillMatchPercentage ?? 0;
        analysis.experienceAlignmentScore = parsed.experienceAlignmentScore ?? 0;
        analysis.missingHardSkills = parsed.missingHardSkills ?? parsed.missingSkills ?? [];
        analysis.missingToolsAndPlatforms = parsed.missingToolsAndPlatforms ?? [];
        analysis.missingMethodologies = parsed.missingMethodologies ?? [];
        analysis.missingKeywords = parsed.missingKeywords ?? [];
        analysis.resumeImprovements = parsed.resumeImprovements ?? parsed.suggestions ?? [];
        analysis.interviewTopics = parsed.interviewTopics ?? [];
        analysis.interviewQuestions = parsed.interviewQuestions ?? parsed.questions ?? [];

        analysis.matchScore = Number(analysis.matchScore);
        if (isNaN(analysis.matchScore) || analysis.matchScore < 0) analysis.matchScore = 0;
        if (analysis.matchScore > 100) analysis.matchScore = 100;

      } catch (err: any) {
        console.error('[ANALYSIS-FLOW-ERROR]', err?.message || err);
        analysis.diagnostics.error = err.message;
        analysis.diagnostics.stage = 'AI_ANALYSIS_BLOCK';
      }

      // 4. Advanced Embedding-based Matching
      console.log('Calculating TF-IDF similarity...');
      try {
        const tfidfScore = await this.calculateSimilarity(resumeText, jd);
        console.log('TF-IDF Score:', tfidfScore);

        if (!isNaN(tfidfScore) && tfidfScore > 0) {
          const llmScore = Number(analysis.matchScore) || 0;
          if (llmScore > 95) {
            // If LLM says it's nearly perfect, trust it fully to allow for 100%
            analysis.matchScore = llmScore;
          } else if (llmScore > 0) {
            // Increased LLM weight to 85% as LLM is generally better at context than pure TF-IDF
            analysis.matchScore = Math.round((llmScore * 0.85) + (tfidfScore * 100 * 0.15));
            console.log(`[DEBUG] Blended score - LLM: ${llmScore}, TF-IDF: ${tfidfScore}, Final: ${analysis.matchScore}`);
          } else {
            analysis.matchScore = Math.round(tfidfScore * 100);
          }
        }
      } catch (e) {
        console.error('TF-IDF calculation failed:', e);
      }

      // Ensure final score is valid
      analysis.matchScore = Math.max(0, Math.min(100, Math.round(analysis.matchScore)));
      console.log('[DEBUG] Final matchScore:', analysis.matchScore);

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

      const raw = await this.callWithRetry(() => this.aiCall(prompt));
      console.log('[DEBUG] JD Structuring Raw Response:', raw);

      if (!raw || (typeof raw === 'string' && raw.length < 5)) {
        console.warn('[WARNING] AI returned empty response for JD structuring');
        throw new Error('Empty response from AI');
      }

      const cleaned = typeof raw === 'string'
        ? raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        : JSON.stringify(raw);

      // Try to find JSON object in the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const jsonToParse = jsonMatch ? jsonMatch[0] : cleaned;

      try {
        let parsed = JSON.parse(jsonToParse);
        console.log('[DEBUG] Structured JD successfully parsed. Keys:', Object.keys(parsed));

        // Defense: If we accidentally parsed the metadata object (with role: assistant)
        // instead of the ACTUAL content, try to find the real content inside it.
        if (parsed.role === 'assistant' && parsed.content) {
          console.warn('[WARNING] Parsed metadata instead of content. Retrying on inner content...');
          const innerText = this.openAIResponsesService.extractContent(parsed);
          if (innerText && innerText !== 'assistant') {
            const innerMatch = innerText.match(/\{[\s\S]*\}/);
            if (innerMatch) parsed = JSON.parse(innerMatch[0]);
          }
        }

        return parsed;
      } catch (parseErr) {
        console.error('[ERROR] Failed to parse structured JD JSON:', parseErr);
        throw parseErr;
      }
    } catch (err: any) {
      console.error('OpenRouter Structuring Error:', err);
      // Fallback object so the process can continue
      return {
        role: 'Job Opportunity',
        company: 'Unspecified Company',
        skills: [],
        responsibilities: [],
        qualifications: [],
        experience: 'Not specified',
        fullDescription: rawText.substring(0, 5000)
      };
    }
  }

  // Extract text using pdf-parse (Generally more robust than pdfreader)
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const pdf = require('pdf-parse');
    try {
      const data = await pdf(buffer);
      console.log('[AnalyzeService] PDF extracted successfully, length:', data.text?.length || 0);
      return data.text || '';
    } catch (err: any) {
      console.error('[AnalyzeService] PDF extraction error:', err.message);
      // Fallback to pdfreader
      const { PdfReader } = require('pdfreader');
      return new Promise((resolve, reject) => {
        let finalText = '';
        new PdfReader().parseBuffer(buffer, (err2, item) => {
          if (err2) reject(err2);
          else if (!item) resolve(finalText);
          else if (item.text) finalText += item.text + ' ';
        });
      });
    }
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
          '[data-test-id="job-posting-description"]',
          '.jobs-box__html-content',
          '.main-content',
          'main',
          'article'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim().length > 100) {
            return (el as HTMLElement).innerText;
          }
        }
        return document.body.innerText; // Fallback to all text
      });

      console.log('[DEBUG-SCRAPE] Scraped LinkedIn text length:', jd?.length || 0);

      await browser.close();
      return jd?.trim() || '';
    } catch (e) {
      console.error('[DEBUG-SCRAPE] LinkedIn JD Error:', e.message);
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
          if (el && (el as HTMLElement).innerText.trim().length > 100) return (el as HTMLElement).innerText;
        }

        // Expanded generic searches
        const commonSelectors = ['main', 'article', '.job-description', '#job-description', '.description', '#description', 'section'];
        for (const sel of commonSelectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim().length > 200) return (el as HTMLElement).innerText;
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        })
        .timeout(15000) // Increased timeout to 15 seconds
        .end((res: any) => {
          console.log('[CheerioScrape] Response Status:', res.status);

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

          const bodySnippet = typeof res.body === 'string' ? res.body.substring(0, 500) : 'Non-string body';
          console.log('[CheerioScrape] Body Snippet:', bodySnippet);

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
              '.description',
              '#description',
              '.job-details',
              '.posting-description',
              'section',
            ];

            for (const selector of genericSelectors) {
              const text = $(selector).text().trim();
              if (text && text.length > 100) {
                console.log(`[CheerioScrape] Found content with selector: ${selector}, length: ${text.length}`);
                resolve(text);
                return;
              }
            }

            // Last resort: find the element with the most text density or just largest text block
            let bestText = '';
            $('div, section, article').each((_, el) => {
              const t = $(el).text().trim();
              if (t.length > bestText.length) {
                bestText = t;
              }
            });

            if (bestText.length > 200) {
              console.log(`[CheerioScrape] Using densest text block, length: ${bestText.length}`);
              resolve(bestText.substring(0, 15000));
              return;
            }

            // Absolute body text fallback
            const bodyText = $('body').text().trim();
            if (bodyText && bodyText.length > 200) {
              console.log(`[CheerioScrape] Using body text, length: ${bodyText.length}`);
              resolve(bodyText.substring(0, 10000));
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
      const raw = await this.callWithRetry(() => this.aiCall(prompt));
      const cleaned = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
      const jsonMatch = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
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

      const raw = await this.callWithRetry(() => this.aiCall(prompt));
      const cleaned = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
      const jsonMatch = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch (err) {
      console.error('Resume Parsing Error:', err);
      return { error: 'Failed to parse resume to JSON.' };
    }
  }

  private async aiCall(prompt: string): Promise<string> {
    console.log('[DEBUG] Calling AI via OpenAIResponsesService');
    try {
      return await this.openAIResponsesService.generateResponse(prompt);
    } catch (error: any) {
      console.error('[DEBUG] AI Service Error:', error);
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
