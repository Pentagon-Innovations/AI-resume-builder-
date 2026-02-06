import { Injectable, StreamableFile, BadRequestException } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
// @ts-ignore - @sparticuz/chromium may not have type definitions
import chromium from '@sparticuz/chromium';
import { setTimeout } from 'node:timers/promises';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume } from '../resume/resume.schema';
import { getImageSrc } from '../helpers/handlebars-helpers'; // Import helper

@Injectable()
export class PdfService {
  constructor(
    @InjectModel('Resume') private readonly resumeModel: Model<Resume>,
  ) {
    // Register the helper within this service
    handlebars.registerHelper('getImageSrc', getImageSrc);
  }

  async generatePdf(resumeId: string): Promise<StreamableFile> {
    let browser: any = null;

    try {
      console.log(`🔍 Generating PDF for resume ID: ${resumeId}`);

      // Fetch resume data from MongoDB
      const resume = await this.resumeModel.findById(resumeId).lean();
      if (!resume) {
        console.error(`❌ Resume not found: ${resumeId}`);
        throw new Error(`Resume not found: ${resumeId}`);
      }

      console.log(`✅ Resume found: ${resume.firstName} ${resume.lastName}, Template: ${resume.templateType}`);

      // Handle profile photo
      if (resume.profilePhoto) {
        try {
          resume.profilePhotoBase64 = getImageSrc(resume.profilePhoto);
          console.log('✅ Profile photo processed');
        } catch (photoError) {
          console.warn('⚠️ Error processing profile photo:', photoError);
          resume.profilePhotoBase64 = '/default-profile.png';
        }
      } else {
        resume.profilePhotoBase64 = '/default-profile.png';
      }

      // Get template path with more robust resolution for Vercel
      let templateType = `resume_template_${resume.templateType || 1}.hbs`;

      // Try multiple potential paths for Vercel consistency
      const potentialPaths = [
        path.join(process.cwd(), 'dist', 'templates', templateType),
        path.join(process.cwd(), 'build-resume-backend', 'dist', 'templates', templateType),
        path.join(__dirname, '..', 'templates', templateType),
        path.join(__dirname, '..', '..', 'templates', templateType)
      ];

      let templatePath = potentialPaths[0];
      for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      console.log(`🔍 Resolved template path: ${templatePath}`);
      console.log(`🔍 Current Directory (__dirname): ${__dirname}`);
      console.log(`🔍 Process Working Directory (cwd): ${process.cwd()}`);

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template not found: ${templatePath}`);
        throw new Error(`Template not found: ${templateType}`);
      }

      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      console.log(`✅ Template loaded: ${templateType}`);

      // Compile template
      const compileTemplate = handlebars.compile(templateHtml);
      const htmlContent = compileTemplate(resume);
      console.log('✅ HTML content generated');

      // Launch Puppeteer with Vercel-optimized settings
      console.log('🚀 Launching Puppeteer...');

      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

      let executablePath: string | undefined;
      let launchArgs: string[];

      if (isProduction) {
        // Use serverless Chromium for Vercel
        // Configure Chromium for serverless environment
        // Note: @sparticuz/chromium doesn't have setGraphicsMode/setHeadlessMode methods
        // These are handled automatically in serverless environments

        try {
          executablePath = await chromium.executablePath();
          // Use the args provided by chromium, but ensure we have the necessary ones
          launchArgs = [
            ...chromium.args,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ];
          console.log('🔍 Using serverless Chromium for Vercel');
          console.log('🔍 Executable path:', executablePath);
          console.log('🔍 Chromium args count:', launchArgs.length);
        } catch (chromiumError) {
          console.error('❌ Failed to get Chromium executable:', chromiumError);
          throw new BadRequestException('PDF generation service unavailable. Please try again later.');
        }
      } else {
        // Local development - use system Chrome or specified path
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
        launchArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ];
        console.log('🔍 Using local Chrome/Chromium');
      }

      browser = await puppeteer.launch({
        args: launchArgs,
        defaultViewport: isProduction ? chromium.defaultViewport : { width: 1280, height: 720 },
        executablePath,
        headless: isProduction ? chromium.headless : true,
      } as any);
      console.log('✅ Puppeteer launched');

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await setTimeout(2000); // Ensure rendering is complete

      // Apply page styles
      await page.addStyleTag({
        content: `
        @page {
            margin-top: 10mm;
            margin-right: 10mm;
            margin-bottom: 20mm;
            margin-left: 10mm;
        }`,
      });

      console.log('📄 Generating PDF...');
      // Generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        scale: 1.0,
      });

      console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);
      return new StreamableFile(pdfBuffer);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        resumeId,
      });

      // Re-throw with more context
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('✅ Browser closed');
        } catch (closeError) {
          console.error('⚠️ Error closing browser:', closeError);
        }
      }
    }
  }
}
