import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { AdminRole } from './admin-user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
