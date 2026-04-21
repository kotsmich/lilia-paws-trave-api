import { IsString, IsIn, IsNumber, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDogDto {
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @ValidateIf(o => o.size != null)
  @IsIn(['small', 'medium', 'large'])
  size?: 'small' | 'medium' | 'large' | null;

  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @ValidateIf(o => o.gender != null)
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female' | null;

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
  @IsUUID()
  requesterId?: string | null;

  @IsOptional()
  @IsString()
  newRequesterName?: string;

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
  pickupLocationId?: string | null;

  @IsOptional()
  @IsString()
  receiver?: string | null;
}
