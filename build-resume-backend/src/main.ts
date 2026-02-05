import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

let app: NestExpressApplication;

async function bootstrap() {
  console.log('--- VERCEL DEPLOYMENT BOOTSTRAP (v2) ---');
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS with explicit production origins
    const allowedOrigins = [
      'http://localhost:5173',
      'https://resume-builder-frontend-seven-black.vercel.app',
      'https://resume-builder-frontend-teal.vercel.app',
      'https://resume-builder-frontend.vercel.app',
    ];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        // Use a more robust check (regex or includes)
        const isAllowed = allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'));

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Origin'],
      exposedHeaders: ['Content-Disposition'],
      preflightContinue: false,
      optionsSuccessStatus: 200, // Changed to 200 for better compatibility
    });

    console.log('✅ CORS enabled with origins:', allowedOrigins);

    app.setBaseViewsDir(join(__dirname, 'templates'));
    app.setViewEngine('hbs');

    app.useStaticAssets(join(__dirname, '..', 'public'));

    // Only call listen if we are not in a serverless environment
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      const port = process.env.PORT || 3000;
      await app.listen(port);
      console.log(`Server is running on http://localhost:${port}`);
    } else {
      await app.init();
    }
  }
  return app;
}

// For Vercel serverless
export default async (req: any, res: any) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://resume-builder-frontend-seven-black.vercel.app',
    'https://resume-builder-frontend-teal.vercel.app',
    'https://resume-builder-frontend.vercel.app',
  ];

  const origin = req.headers.origin;
  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost'));

  console.log(`[VERCEL] Incoming request: ${req.method} ${req.url}, Origin: ${origin}, Allowed: ${isAllowedOrigin}`);

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization,X-Requested-With,Origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('[VERCEL] Handling OPTIONS preflight');
    res.status(200).end();
    return;
  }

  try {
    const instance = await bootstrap();
    const server = instance.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Start for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap();
}
