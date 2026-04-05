import { IsString, IsIn, IsNumber, IsOptional, IsEmail, IsUUID, Min, Matches } from 'class-validator';

export class CreateDogDto {
  @IsString()
  name: string;

  @IsIn(['small', 'medium', 'large'])
  size: 'small' | 'medium' | 'large';

  @IsIn(['male', 'female'])
  gender: 'male' | 'female';

  @IsNumber()
  @Min(0)
  age: number;

  @IsString()
  @Matches(/^\d{15}$/)
  chipId: string;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropLocation: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsString()
  newRequesterName?: string;
}
