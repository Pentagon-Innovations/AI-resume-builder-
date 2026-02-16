import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        // Get required configuration
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

        if (!clientID || !clientSecret) {
            const missing: string[] = [];
            if (!clientID) missing.push('GOOGLE_CLIENT_ID');
            if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
            console.error('❌ Missing required Google OAuth configuration:', missing.join(', '));
            throw new Error(`Missing required Google OAuth configuration: ${missing.join(', ')}`);
        }

        // Construct callback URL - ensure no trailing slashes
        let backendUrl = configService.get<string>('BACKEND_URL');

        // Fallback: try to construct from request if BACKEND_URL not set
        if (!backendUrl) {
            // In Vercel, we can use VERCEL_URL if available
            backendUrl = process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';
            console.warn('⚠️ BACKEND_URL not set, using fallback:', backendUrl);
        }

        // Remove trailing slashes
        backendUrl = backendUrl.replace(/\/+$/, '');
        const callbackURL = `${backendUrl}/auth/google/callback`;

        // Log for debugging
        console.log('🔐 Google OAuth Configuration:');
        console.log('  - BACKEND_URL:', configService.get<string>('BACKEND_URL') || 'NOT SET');
        console.log('  - VERCEL_URL:', process.env.VERCEL_URL || 'NOT SET');
        console.log('  - Resolved Backend URL:', backendUrl);
        console.log('  - Callback URL:', callbackURL);
        console.log('  - Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET');
        console.log('  - Client Secret Length:', clientSecret ? clientSecret.length : 0);

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
        });

        console.log('✅ Google OAuth Strategy initialized successfully');
    }

    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        try {
            console.log('🔍 Google OAuth validate called');
            console.log('🔍 Profile ID:', profile?.id);
            console.log('🔍 Profile emails:', profile?.emails);

            if (!profile || !profile.id) {
                console.error('❌ Invalid profile received from Google');
                throw new Error('Invalid profile received from Google OAuth');
            }

            const user = await this.authService.validateOAuthUser(profile, 'google');
            console.log('✅ User validated/created:', user.email);
            return user;
        } catch (error) {
            console.error('❌ Error in Google OAuth validate:', error);
            throw error;
        }
    }
}
