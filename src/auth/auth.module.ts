import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';
import { AdminUser } from './admin-user.entity';
import { AdminSeedService } from './admin-seed.service';
import { SlidingSessionInterceptor } from './sliding-session.interceptor';
import { SESSION_TTL_SECONDS } from './session.constants';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([AdminUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'change-me-in-production',
        signOptions: { expiresIn: SESSION_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminGuard, AdminSeedService, SlidingSessionInterceptor],
  exports: [JwtModule, SlidingSessionInterceptor],
})
export class AuthModule {}
