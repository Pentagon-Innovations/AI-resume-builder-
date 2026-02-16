import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-dev-secret-change-in-production',
        });
    }

    async validate(payload: any) {
        if (!payload || !payload.sub) {
            console.error('[AUTH] JwtStrategy Validation FAILED: Payload missing "sub"', payload);
        } else {
            console.log('[AUTH] JwtStrategy Validation SUCCESS for user:', payload.sub);
        }
        return { userId: payload.sub, email: payload.email };
    }
}
