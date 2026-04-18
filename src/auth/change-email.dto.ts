import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsEmail()
  newEmail!: string;
}
