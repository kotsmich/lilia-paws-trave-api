import { IsString, IsIn, IsNumber, IsOptional, IsEmail, IsUUID, Min } from 'class-validator';

export class UpdateDogDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  size?: 'small' | 'medium' | 'large';

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female';

  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  chipId?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  dropLocation?: string;

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
  requestId?: string | null;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  documentUrl?: string | null;

  @IsOptional()
  @IsString()
  destinationId?: string | null;

  @IsOptional()
  @IsString()
  receiver?: string | null;
}
