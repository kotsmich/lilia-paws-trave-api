import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminRole } from './admin-user.entity';
import { RevokedToken } from './revoked-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepo: Repository<RevokedToken>,
  ) {}

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; role: AdminRole } }> {
    const admin = await this.adminRepo.findOne({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role, jti: randomUUID() });
    return { token, user: { id: admin.id, email: admin.email, role: admin.role } };
  }

  async me(userId: string): Promise<{ id: string; email: string; role: AdminRole }> {
    const admin = await this.adminRepo.findOne({ where: { id: userId } });
    if (!admin) throw new UnauthorizedException('Session invalid');
    return { id: admin.id, email: admin.email, role: admin.role };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this.adminRepo.findOne({ where: { id: userId } });
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.adminRepo.save(admin);
  }

  async changeEmail(userId: string, currentPassword: string, newEmail: string): Promise<{ token: string; email: string }> {
    const admin = await this.adminRepo.findOne({ where: { id: userId } });
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const existing = await this.adminRepo.findOne({ where: { email: newEmail } });
    if (existing) throw new ConflictException('Email already in use');
    admin.email = newEmail;
    await this.adminRepo.save(admin);
    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role, jti: randomUUID() });
    return { token, email: newEmail };
  }

  async logout(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ jti?: string; exp?: number }>(token);
      if (payload.jti && payload.exp) {
        await this.revokedTokenRepo.save({ jti: payload.jti, expiresAt: new Date(payload.exp * 1000) });
      }
    } catch {
      // Already expired or invalid — no revocation needed
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    await this.revokedTokenRepo.createQueryBuilder().delete().where('"expiresAt" < NOW()').execute();
  }

  async listUsers(): Promise<{ id: string; email: string; role: AdminRole }[]> {
    const users = await this.adminRepo.find({ order: { createdAt: 'ASC' } });
    return users.map((u) => ({ id: u.id, email: u.email, role: u.role }));
  }

  async updateUser(
    userId: string,
    data: { email?: string; role?: AdminRole },
  ): Promise<{ id: string; email: string; role: AdminRole }> {
    const user = await this.adminRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (data.email && data.email !== user.email) {
      const existing = await this.adminRepo.findOne({ where: { email: data.email } });
      if (existing) throw new ConflictException('Email already in use');
      user.email = data.email;
    }
    if (data.role) user.role = data.role;
    await this.adminRepo.save(user);
    return { id: user.id, email: user.email, role: user.role };
  }

  async createUser(email: string, password: string, role: AdminRole): Promise<{ id: string; email: string; role: AdminRole }> {
    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.adminRepo.save({ email, passwordHash, role });
    return { id: user.id, email: user.email, role: user.role };
  }
}
