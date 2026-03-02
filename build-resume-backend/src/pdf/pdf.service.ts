import { Injectable, StreamableFile, BadRequestException } from '@nestjs/common';
import puppeteer from 'puppeteer';
// @ts-ignore - @sparticuz/chromium may not have type definitions
import chromium from '@sparticuz/chromium';
import { setTimeout } from 'node:timers/promises';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume } from '../resume/resume.schema';
import { getImageSrc, formatDate } from '../helpers/handlebars-helpers'; // Import helpers

@Injectable()
export class PdfService {
  constructor(
    @InjectModel('Resume') private readonly resumeModel: Model<Resume>,
  ) {
    // Register the helper within this service
    handlebars.registerHelper('getImageSrc', getImageSrc);
    handlebars.registerHelper('formatDate', formatDate);
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
      const selectedTemplate = (resume.templateType !== undefined && resume.templateType !== null) ? resume.templateType : 1;
      let templateType = `resume_template_${selectedTemplate}.hbs`;

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

      // Use bundled Chromium if on Vercel or explicitly requested
      const useBundled = !!process.env.VERCEL || process.env.USE_BUNDLED_CHROMIUM === 'true';
      const wsEndpoint = process.env.PUPPETEER_WS_ENDPOINT;

      console.log(`🔍 Environment: ${useBundled ? 'Bundled Chromium' : wsEndpoint ? 'Remote Browser' : 'Standard Puppeteer'}`);

      let executablePath: string | undefined;
      let launchArgs: string[] = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ];

      if (wsEndpoint) {
        console.log(`🔍 Connecting to remote browser: ${wsEndpoint}`);
        browser = await puppeteer.connect({
          browserWSEndpoint: wsEndpoint,
          defaultViewport: chromium.defaultViewport,
        });
      } else if (useBundled) {
        try {
          executablePath = await chromium.executablePath();
          launchArgs = [...chromium.args, ...launchArgs];
          console.log(`🔍 Using bundled Chromium (@sparticuz/chromium)`);
        } catch (chromiumError) {
          console.error('❌ Failed to get Chromium executable:', chromiumError);
          if (!!process.env.VERCEL) {
            throw new BadRequestException('PDF generation service unavailable on Vercel.');
          }
        }

        if (executablePath) {
          browser = await puppeteer.launch({
            args: launchArgs,
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: true,
          } as any);
        } else {
          console.warn('⚠️ Bundled Chromium path not found, falling back to standard launch');
          browser = await puppeteer.launch({
            args: launchArgs,
            headless: true,
          });
        }
      } else {
        // Self-hosted (CloudPanel/VPS) - let puppeteer find its own chrome
        console.log(`🔍 Using standard Puppeteer launch`);
        browser = await puppeteer.launch({
          args: launchArgs,
          headless: true,
        });
      }
      console.log('✅ Puppeteer launched');

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await setTimeout(2000); // Ensure rendering is complete

      // Apply page styles to help with single-page consolidation
      await page.addStyleTag({
        content: `
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
        }
        * {
            box-sizing: border-box;
            overflow-wrap: break-word;
        }
        .section, h2, h3, .item {
            page-break-inside: avoid;
        }
        `,
      });

      console.log('📄 Generating PDF...');
      // Generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }, // Slightly tighter margins
        scale: 0.98, // Increased scale for better readability, but still safe
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
