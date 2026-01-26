import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeModule } from './resume/resume.module';
import { PdfModule } from './pdf/pdf.module';
import { AnalyzeModule } from './analyze/analyze.module';
import { ImproveResumeModule } from './updateResume/improve-resume.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ATSModule } from './ats/ats.module';
import { BillingModule } from './billing/billing.module';
import { TestModule } from './test/test.module';

import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/resumeDB';
        
        return {
          uri,
          // Serverless-optimized connection options
          serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
          socketTimeoutMS: 45000, // 45 seconds socket timeout
          connectTimeoutMS: 10000, // 10 seconds connection timeout
          maxPoolSize: 10, // Maximum number of connections in the pool
          minPoolSize: 1, // Minimum number of connections in the pool
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
          retryWrites: true, // Retry write operations on network errors
          retryReads: true, // Retry read operations on network errors
          // Note: bufferCommands and bufferMaxEntries are Mongoose-specific options
          // and should be set on the Mongoose connection, not passed to MongoDB driver
        };
      },
      inject: [ConfigService],
    }),
    ResumeModule,
    PdfModule,
    AnalyzeModule,
    ImproveResumeModule,
    UsersModule,
    AuthModule,
    ATSModule,
    BillingModule,
    TestModule,
  ],
})
export class AppModule { }
