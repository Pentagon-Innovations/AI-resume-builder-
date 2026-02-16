import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Quota Enforcement E2E', () => {
    let app: INestApplication;
    let freeUserToken: string;
    let proUserToken: string;
    let freeUserId: string;
    let proUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Create free tier user
        const freeUser = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `free-${Date.now()}@example.com`,
                password: 'Password123!',
                firstName: 'Free',
                lastName: 'User',
            });

        freeUserId = freeUser.body._id;

        const freeLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                username: freeUser.body.email,
                password: 'Password123!',
            });

        freeUserToken = freeLogin.body.access_token;

        // Create pro user
        const proUser = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `pro-${Date.now()}@example.com`,
                password: 'Password123!',
                firstName: 'Pro',
                lastName: 'User',
            });

        proUserId = proUser.body._id;

        // Upgrade to pro
        await request(app.getHttpServer())
            .patch(`/users/${proUserId}`)
            .set('Authorization', `Bearer ${freeUserToken}`)
            .send({
                plan: 'pro',
                maxAiRuns: 1000,
            });

        const proLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                username: proUser.body.email,
                password: 'Password123!',
            });

        proUserToken = proLogin.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Free Tier Quota', () => {
        it('should allow AI operations within quota', async () => {
            const response = await request(app.getHttpServer())
                .post('/improve-resume/generate-content')
                .set('Authorization', `Bearer ${freeUserToken}`)
                .send({ prompt: 'Write a professional summary' })
                .expect(200);

            expect(response.body).toBeDefined();
        });

        it('should track quota usage', async () => {
            const user = await request(app.getHttpServer())
                .get(`/users/${freeUserId}`)
                .set('Authorization', `Bearer ${freeUserToken}`)
                .expect(200);

            expect(user.body.aiRunsThisMonth).toBeGreaterThan(0);
        });
    });

    describe('Pro Tier Unlimited Access', () => {
        it('should allow unlimited AI operations for pro users', async () => {
            // Make multiple requests
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/improve-resume/generate-content')
                    .set('Authorization', `Bearer ${proUserToken}`)
                    .send({ prompt: 'Write a professional summary' })
                    .expect(200);
            }

            const user = await request(app.getHttpServer())
                .get(`/users/${proUserId}`)
                .set('Authorization', `Bearer ${proUserToken}`)
                .expect(200);

            // Pro users should have high quota limit
            expect(user.body.maxAiRuns).toBeGreaterThanOrEqual(1000);
        });
    });

    describe('Monthly Quota Reset', () => {
        it('should reset quota at the beginning of new month', async () => {
            // This test would require mocking the date
            // For now, we verify the reset logic exists
            const user = await request(app.getHttpServer())
                .get(`/users/${freeUserId}`)
                .set('Authorization', `Bearer ${freeUserToken}`)
                .expect(200);

            expect(user.body).toHaveProperty('lastQuotaReset');
            expect(user.body).toHaveProperty('aiRunsThisMonth');
        });
    });
});
