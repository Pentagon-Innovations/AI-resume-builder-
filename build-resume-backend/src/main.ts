import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

let app: NestExpressApplication;

async function bootstrap() {
  console.log('--- BACKEND BOOTSTRAP ---');
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Increase body limits for large resumes and photos
    const express = require('express');
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Consolidate CORS origin verification
    const isAllowedOrigin = (origin: string): boolean => {
      if (!origin) return true;
      const normalized = origin.toLowerCase().trim().replace(/\/+$/, '');
      const isLocal = normalized === 'http://localhost:5173' || normalized === 'http://localhost:3000';
      const isVercel = normalized.endsWith('.vercel.app');
      const isDomain = normalized.includes('aijobmatch.ai') || normalized.includes('resume-builder-frontend'); // Added aijobmatch.ai
      return isLocal || isVercel || isDomain;
    };

    app.enableCors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Origin', 'Range'],
      exposedHeaders: ['Content-Disposition', 'Content-Range', 'Content-Length', 'Accept-Ranges'],
      preflightContinue: false,
      optionsSuccessStatus: 200,
    });

    console.log('✅ CORS enabled with robust origin matching');

    app.setBaseViewsDir(join(__dirname, 'templates'));
    app.setViewEngine('hbs');

    app.useStaticAssets(join(__dirname, '..', 'public'));

    // Only call listen if we are not in a serverless environment
    if (!process.env.VERCEL) {
      const port = process.env.PORT || 3000;
      await app.listen(port);
      console.log(`✅ Server is running on port ${port} with /api prefix`);
    } else {
      await app.init();
    }
  }
  return app;
}

// For Vercel serverless
export default async (req: any, res: any) => {
  const origin = (req.headers.origin || '').toString();

  // Consolidate CORS origin verification
  const isAllowedOrigin = (origin: string): boolean => {
    if (!origin) return true;
    const normalized = origin.toLowerCase().trim().replace(/\/+$/, '');
    const isLocal = normalized === 'http://localhost:5173' || normalized === 'http://localhost:3000';
    const isVercel = normalized.endsWith('.vercel.app');
    const isDomain = normalized.includes('aijobmatch.ai') || normalized.includes('resume-builder-frontend');
    return isLocal || isVercel || isDomain;
  };

  const allowed = isAllowedOrigin(origin);
  console.log(`[VERCEL] Incoming: ${req.method} ${req.url}, Origin: ${origin}, Allowed: ${allowed}`);

  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization,X-Requested-With,Origin,Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition,Content-Range,Content-Length,Accept-Ranges');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const instance = await bootstrap();
    const server = instance.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Start for local development or VPS
if (!process.env.VERCEL) {
  bootstrap();
}
