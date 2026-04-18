import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { AdminRole } from './admin-user.entity';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}
