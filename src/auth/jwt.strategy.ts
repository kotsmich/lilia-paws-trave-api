import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AdminUser } from './admin-user.entity';
import { RevokedToken } from './revoked-token.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepo: Repository<RevokedToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies as Record<string, string>)?.['admin_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; jti?: string }): Promise<{ userId: string; email: string; role: string } | null> {
    if (payload.jti) {
      const revoked = await this.revokedTokenRepo.findOne({ where: { jti: payload.jti } });
      if (revoked) throw new UnauthorizedException('Token has been revoked');
    }
    const user = await this.adminRepo.findOne({ where: { id: payload.sub } });
    if (!user) return null;
    return { userId: user.id, email: user.email, role: user.role };
  }
}
