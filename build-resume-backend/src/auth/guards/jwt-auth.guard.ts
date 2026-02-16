import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info, context) {
        if (err || !user) {
            console.error('[AUTH] JwtAuthGuard FAILED');
            console.error('  - Error:', err);
            console.log('  - Info:', info?.message || info);
            console.log('  - Context:', context.switchToHttp().getRequest().url);
        }
        return super.handleRequest(err, user, info, context);
    }
}
