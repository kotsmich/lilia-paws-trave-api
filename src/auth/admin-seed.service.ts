import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.adminRepo.count();
    if (count > 0) return;

    const email = this.config.get<string>('ADMIN_EMAIL')!;
    const password = this.config.get<string>('ADMIN_PASSWORD')!;
    const passwordHash = await bcrypt.hash(password, 12);

    await this.adminRepo.save({ email, passwordHash });
    this.logger.log(`Admin account created for ${email}`);
  }
}
