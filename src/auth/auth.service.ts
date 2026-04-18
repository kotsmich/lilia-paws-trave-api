import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminRole } from './admin-user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
  ) {}

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; role: AdminRole } }> {
    const admin = await this.adminRepo.findOne({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role });
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
    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role });
    return { token, email: newEmail };
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
