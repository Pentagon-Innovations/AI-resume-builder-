import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication E2E', () => {
    let app: INestApplication;
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('User Registration and Login Flow', () => {
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
        };

        it('should register a new user', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('_id');
                    expect(response.body.email).toBe(testUser.email);
                    userId = response.body._id;
                });
        });

        it('should not register duplicate email', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(400);
        });

        it('should login with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: testUser.email,
                    password: testUser.password,
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('access_token');
                    authToken = response.body.access_token;
                });
        });

        it('should not login with invalid credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: testUser.email,
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('should access protected route with valid token', () => {
            return request(app.getHttpServer())
                .get(`/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });

        it('should not access protected route without token', () => {
            return request(app.getHttpServer())
                .get(`/users/${userId}`)
                .expect(401);
        });
    });

    describe('Password Reset Flow', () => {
        const resetEmail = `reset-${Date.now()}@example.com`;

        beforeAll(async () => {
            // Create user for password reset test
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: resetEmail,
                    password: 'OldPassword123!',
                    firstName: 'Reset',
                    lastName: 'Test',
                });
        });

        it('should request password reset', () => {
            return request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: resetEmail })
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('message');
                });
        });

        it('should not reset password with invalid token', () => {
            return request(app.getHttpServer())
                .post('/auth/reset-password')
                .send({
                    token: 'invalid-token',
                    newPass: 'NewPassword123!',
                })
                .expect(400);
        });
    });
});
