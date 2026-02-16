import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            console.warn('[AUTH] JwtStrategy: WARNING! JWT_SECRET is not set. Using insecure default fallback.');
        } else {
            console.log(`[AUTH] JwtStrategy: Initialized with JWT_SECRET (prefix: ${secret.substring(0, 4)}...)`);
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret || 'default-dev-secret-change-in-production',
        });
    }

    async validate(payload: any) {
        if (!payload || !payload.sub) {
            console.error('[AUTH] JwtStrategy Validation FAILED: Payload missing "sub" or invalid', payload);
            return null;
        } else {
            console.log('[AUTH] JwtStrategy Validation SUCCESS for user:', payload.sub);
        }
        return { userId: payload.sub, email: payload.email };
    }
}
