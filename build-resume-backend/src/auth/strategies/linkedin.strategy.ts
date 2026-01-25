import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(
        configService: ConfigService,
        private authService: AuthService,
    ) {
        // Construct callback URL - ensure no trailing slashes
        const backendUrl = (configService.get<string>('BACKEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
        const callbackURL = `${backendUrl}/auth/linkedin/callback`;
        
        // Log callback URL for debugging (remove in production if sensitive)
        console.log('LinkedIn OAuth Callback URL:', callbackURL);
        
        super({
            clientID: configService.get<string>('LINKEDIN_CLIENT_ID') || 'client_id',
            clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET') || 'client_secret',
            callbackURL,
            scope: ['r_emailaddress', 'r_liteprofile'],
            session: false, // Disable sessions for Vercel serverless compatibility
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        const user = await this.authService.validateOAuthUser(profile, 'linkedin');
        return user;
    }
}
