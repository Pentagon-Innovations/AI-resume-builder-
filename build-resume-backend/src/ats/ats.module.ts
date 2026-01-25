import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ATSController } from './ats.controller';
import { ATSService } from './ats.service';
import { JobSchema, ApplicationSchema } from './ats.schema';
import { AnalyzeModule } from '../analyze/analyze.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Job', schema: JobSchema },
            { name: 'Application', schema: ApplicationSchema },
        ]),
        AnalyzeModule,
        UsersModule,
    ],
    controllers: [ATSController],
    providers: [ATSService],
    exports: [ATSService],
})
export class ATSModule { }
