import { Controller, Get, Param, Header, HttpException, HttpStatus } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get(':id')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="generated-pdf.pdf"')
  async generatePdf(
    @Param('id')
    resumeId: string,
  ) {
    try {
      console.log(`📥 PDF generation request for resume ID: ${resumeId}`);
      const file = await this.pdfService.generatePdf(resumeId);
      return file;
    } catch (error) {
      console.error(`❌ PDF generation failed for resume ${resumeId}:`, error);
      
      // Return proper HTTP error
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to generate PDF',
          error: 'PDF Generation Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
