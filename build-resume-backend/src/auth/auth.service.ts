import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.schema';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(user: any) {
        if (!user || !user.email || !user._id) {
            console.error('❌ Invalid user data for login:', { 
                hasUser: !!user, 
                hasEmail: !!user?.email, 
                hasId: !!user?._id,
                userType: typeof user 
            });
            throw new BadRequestException('Invalid user data for login');
        }
        
        // Convert Mongoose document to plain object if needed
        const userObj = user.toObject ? user.toObject() : user;
        const userId = String(userObj._id || userObj.id);
        
        const payload = { email: userObj.email, sub: userId };
        
        // Get JWT secrets, with fallback defaults for development
        const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-dev-secret-change-in-production';
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || jwtSecret;
        
        // Warn if using default secrets (not secure for production)
        if (!this.configService.get<string>('JWT_SECRET')) {
            console.warn('⚠️ WARNING: JWT_SECRET not configured, using default secret. This is NOT secure for production!');
            console.warn('⚠️ Please set JWT_SECRET and JWT_REFRESH_SECRET in your environment variables.');
        }
        
        // Access token uses the module's default secret (configured in auth.module.ts)
        // Refresh token uses a potentially different secret
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = refreshSecret === jwtSecret 
            ? this.jwtService.sign(payload, { expiresIn: '7d' })
            : this.jwtService.sign(payload, { expiresIn: '7d', secret: refreshSecret });
        
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                _id: userId,
                email: userObj.email,
                firstName: userObj.firstName || '',
                lastName: userObj.lastName || '',
                picture: userObj.picture,
                role: userObj.role || 'user',
                plan: userObj.plan || 'free',
            },
        };
    }

    async register(createUserDto: any) {
        const existingUser = await this.usersService.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new BadRequestException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });

        return this.login(user); // Auto login after register
    }

    async googleLogin(req) {
        if (!req.user) {
            return 'No user from google';
        }
        return this.login(req.user);
    }

    async validateOAuthUser(profile: any, provider: 'google' | 'linkedin'): Promise<User> {
        if (!profile || !profile.id) {
            throw new BadRequestException('Invalid OAuth profile data');
        }

        const email = profile.emails?.[0]?.value;
        if (!email) {
            throw new BadRequestException('Email not provided in OAuth profile');
        }

        let user;

        if (provider === 'google') {
            user = await this.usersService.findByGoogleId(profile.id);
        } else {
            user = await this.usersService.findByLinkedinId(profile.id);
        }

        if (!user) {
            // Check if user exists by email to link account
            user = await this.usersService.findByEmail(email);
            if (user) {
                if (provider === 'google') {
                    await this.usersService.update(user._id, { googleId: profile.id });
                }
                if (provider === 'linkedin') {
                    await this.usersService.update(user._id, { linkedinId: profile.id });
                }
            } else {
                // Create new user
                const userData: any = {
                    email: email,
                    firstName: profile.name?.givenName || '',
                    lastName: profile.name?.familyName || '',
                    [provider + 'Id']: profile.id,
                };
                
                if (profile.photos?.[0]?.value) {
                    userData.picture = profile.photos[0].value;
                }
                
                user = await this.usersService.create(userData);
            }
        }
        return user;
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new BadRequestException('User with this email does not exist');
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await this.usersService.update(String(user._id), {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetPasswordExpires,
        });

        // Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL || '"Resume Builder" <no-reply@example.com>',
                to: user.email,
                subject: 'Password Reset Request',
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this link to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                `,
            });
        } catch (error) {
            console.error('Email send failed:', error);
            throw new BadRequestException('Email could not be sent');
        }

        return { message: 'Password reset email sent' };
    }

    async resetPassword(token: string, newPass: string) {
        const user = await this.usersService.findByResetToken(token);
        if (!user) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.usersService.update(String(user._id), {
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined,
        });

        return { message: 'Password has been reset' };
    }
}
