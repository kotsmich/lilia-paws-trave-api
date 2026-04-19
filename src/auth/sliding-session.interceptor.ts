import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { SESSION_TTL_MS, SESSION_TTL_SECONDS } from './session.constants';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

@Injectable()
export class SlidingSessionInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (!req.user) return;

        const token = this.jwtService.sign(
          { sub: req.user.userId, email: req.user.email, jti: randomUUID() },
          {
            secret: this.config.getOrThrow<string>('JWT_SECRET'),
            expiresIn: SESSION_TTL_SECONDS,
          },
        );

        res.cookie('admin_token', token, {
          httpOnly: true,
          sameSite: 'strict',
          secure: this.config.get<string>('NODE_ENV') === 'production',
          maxAge: SESSION_TTL_MS,
        });
      }),
    );
  }
}
