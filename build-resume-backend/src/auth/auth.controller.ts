import { Controller, Post, Body, UseGuards, Request, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(@Body() createUserDto: any) {
        return this.authService.register(createUserDto);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req, @Res() res) {
        try {
            // Passport handles the redirect automatically when session is disabled
            // This method is intentionally empty - Passport will redirect to Google
            // The callback URL is logged when GoogleStrategy is instantiated
            console.log('🔍 Google OAuth initiated');
        } catch (error) {
            console.error('❌ Error initiating Google OAuth:', error);
            let frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://resume-builder-frontend-seven-black.vercel.app';
            frontendUrl = frontendUrl.trim().replace(/\/+$/, '');
            if (!frontendUrl.match(/^https?:\/\//i)) {
                frontendUrl = `https://${frontendUrl}`;
            }
            res.redirect(302, `${frontendUrl}/auth/sign-in?error=oauth_init_failed`);
        }
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res) {
        try {
            console.log('🔍 Google OAuth Callback - Request received');
            console.log('🔍 User object:', req.user ? 'exists' : 'missing', req.user);
            
            if (!req.user) {
                throw new Error('No user object from Google OAuth');
            }

            const result = await this.authService.login(req.user);
            
            if (!result || !result.access_token) {
                throw new Error('Failed to generate tokens');
            }

            const user = result.user;
            if (!user || !user.email) {
                throw new Error('Invalid user data from login');
            }

            const userParams = `&email=${encodeURIComponent(user.email)}&firstName=${encodeURIComponent(user.firstName || '')}&lastName=${encodeURIComponent(user.lastName || '')}`;
            
            // Get frontend URL - try multiple sources
            let frontendUrl = this.configService.get<string>('FRONTEND_URL');
            
            if (!frontendUrl) {
                // Fallback: try to detect from request or use common frontend URLs
                const allowedFrontends = [
                    'https://resume-builder-frontend-seven-black.vercel.app',
                    'https://resume-builder-frontend-teal.vercel.app',
                    'https://resume-builder-frontend.vercel.app',
                    'http://localhost:5173'
                ];
                frontendUrl = allowedFrontends[0]; // Use production frontend as default
                console.warn('⚠️ FRONTEND_URL not set, using fallback:', frontendUrl);
            }
            
            // Clean and validate URL
            frontendUrl = frontendUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
            
            // Ensure it's an absolute URL with protocol
            if (!frontendUrl.match(/^https?:\/\//i)) {
                // If no protocol, add https://
                frontendUrl = `https://${frontendUrl}`;
                console.warn('⚠️ Added https:// protocol to FRONTEND_URL:', frontendUrl);
            }
            
            // Validate it's a proper URL
            try {
                new URL(frontendUrl); // This will throw if invalid
            } catch (urlError) {
                console.error('❌ Invalid FRONTEND_URL, using default:', frontendUrl);
                frontendUrl = 'https://resume-builder-frontend-seven-black.vercel.app';
            }
            
            const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}${userParams}`;
            
            console.log('✅ Google OAuth Success - Redirecting to:', redirectUrl);
            console.log('✅ Frontend URL used:', frontendUrl);
            
            // Use absolute redirect
            res.redirect(302, redirectUrl);
        } catch (error) {
            console.error('❌ Google OAuth Callback Error:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Request user:', req.user);
            console.error('❌ Error message:', error?.message);
            
            // Always use a hardcoded absolute URL to avoid any issues
            const defaultFrontendUrl = 'https://resume-builder-frontend-seven-black.vercel.app';
            
            // Try to get FRONTEND_URL from config, but validate it thoroughly
            let frontendUrl = this.configService.get<string>('FRONTEND_URL');
            
            if (frontendUrl) {
                // Clean the URL
                frontendUrl = frontendUrl.trim().replace(/\/+$/, '');
                
                // Ensure it has protocol
                if (!frontendUrl.match(/^https?:\/\//i)) {
                    frontendUrl = `https://${frontendUrl}`;
                }
                
                // Validate it's a proper absolute URL
                try {
                    const urlObj = new URL(frontendUrl);
                    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
                        throw new Error('Invalid protocol');
                    }
                    // URL is valid, use it
                } catch (urlError) {
                    console.error('❌ Invalid FRONTEND_URL format, using default');
                    frontendUrl = defaultFrontendUrl;
                }
            } else {
                console.warn('⚠️ FRONTEND_URL not set, using default:', defaultFrontendUrl);
                frontendUrl = defaultFrontendUrl;
            }
            
            const errorMessage = error?.message || 'Authentication failed';
            // Ensure redirectUrl is always an absolute URL
            const redirectUrl = `${frontendUrl}/auth/sign-in?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
            
            // Final validation - ensure redirectUrl is absolute
            if (!redirectUrl.match(/^https?:\/\//i)) {
                console.error('❌ CRITICAL: Redirect URL is not absolute! Using default');
                const safeRedirectUrl = `${defaultFrontendUrl}/auth/sign-in?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
                console.error('❌ Redirecting to:', safeRedirectUrl);
                return res.redirect(302, safeRedirectUrl);
            }
            
            console.error('❌ Redirecting to error page:', redirectUrl);
            console.error('❌ Frontend URL used:', frontendUrl);
            console.error('❌ FRONTEND_URL env var:', this.configService.get<string>('FRONTEND_URL'));
            
            // Use absolute redirect with explicit status code
            res.redirect(302, redirectUrl);
        }
    }

    @Get('linkedin')
    @UseGuards(AuthGuard('linkedin'))
    async linkedinAuth(@Req() req) {
        // Passport handles the redirect automatically when session is disabled
        // This method is intentionally empty - Passport will redirect to LinkedIn
    }

    @Get('linkedin/callback')
    @UseGuards(AuthGuard('linkedin'))
    async linkedinAuthRedirect(@Req() req, @Res() res) {
        try {
            const result = await this.authService.login(req.user);
            const user = result.user;
            const userParams = `&email=${encodeURIComponent(user.email)}&firstName=${encodeURIComponent(user.firstName || '')}&lastName=${encodeURIComponent(user.lastName || '')}`;
            
            // Get frontend URL - try multiple sources
            let frontendUrl = this.configService.get<string>('FRONTEND_URL');
            
            if (!frontendUrl) {
                // Fallback: try to detect from request or use common frontend URLs
                const allowedFrontends = [
                    'https://resume-builder-frontend-seven-black.vercel.app',
                    'https://resume-builder-frontend-teal.vercel.app',
                    'https://resume-builder-frontend.vercel.app',
                    'http://localhost:5173'
                ];
                frontendUrl = allowedFrontends[0]; // Use production frontend as default
                console.warn('⚠️ FRONTEND_URL not set, using fallback:', frontendUrl);
            }
            
            // Remove trailing slashes
            frontendUrl = frontendUrl.replace(/\/+$/, '');
            const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}${userParams}`;
            
            console.log('✅ LinkedIn OAuth Success - Redirecting to:', redirectUrl);
            
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('❌ LinkedIn OAuth Callback Error:', error);
            const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'https://resume-builder-frontend-seven-black.vercel.app').replace(/\/+$/, '');
            res.redirect(`${frontendUrl}/auth/sign-in?error=oauth_failed`);
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPass: string }) {
        return this.authService.resetPassword(body.token, body.newPass);
    }
}
