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
    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:5173',
          'https://resume-builder-frontend-teal.vercel.app',
          'https://resume-builder-frontend.vercel.app',
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
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
      optionsSuccessStatus: 204,
    });

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
  // Handle CORS preflight requests explicitly
  const allowedOrigins = [
    'http://localhost:5173',
    'https://resume-builder-frontend-teal.vercel.app',
    'https://resume-builder-frontend.vercel.app',
  ];
  
  const origin = req.headers.origin;
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  console.log(`🔍 Request: ${req.method} ${req.url}, Origin: ${origin}, Allowed: ${isAllowedOrigin}`);
  
  // Set CORS headers for all responses
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization,X-Requested-With,Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request for:', req.url);
    res.status(200).end();
    return;
  }
  
  // Wrap response methods to ensure CORS headers persist
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name: string, value: any) {
    // Don't override CORS headers if they're already set
    if (name.toLowerCase().startsWith('access-control-')) {
      const existing = res.getHeader(name);
      if (existing) {
        console.log(`⚠️ CORS header ${name} already set, keeping existing value`);
        return res;
      }
    }
    return originalSetHeader(name, value);
  };
  
  // Ensure CORS headers are set before sending response
  const originalEnd = res.end.bind(res);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  res.end = function(...args: any[]) {
    if (isAllowedOrigin && !res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (!res.getHeader('Access-Control-Allow-Credentials')) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return originalEnd(...args);
  };
  
  res.json = function(body: any) {
    if (isAllowedOrigin && !res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (!res.getHeader('Access-Control-Allow-Credentials')) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return originalJson(body);
  };
  
  res.send = function(body: any) {
    if (isAllowedOrigin && !res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (!res.getHeader('Access-Control-Allow-Credentials')) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return originalSend(body);
  };
  
  try {
    const instance = await bootstrap();
    const server = instance.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    // Ensure CORS headers are set even on error
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Start for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap();
}
