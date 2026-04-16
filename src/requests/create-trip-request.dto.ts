import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsArray,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class DogDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(['small', 'medium', 'large'])
  size!: 'small' | 'medium' | 'large';

  @IsIn(['male', 'female'])
  gender!: 'male' | 'female';

  @IsNumber()
  @Min(0)
  age!: number;

  @IsString()
  @IsNotEmpty()
  chipId!: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation!: string;

  @IsString()
  @IsNotEmpty()
  dropLocation!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  documentType?: string;
}

export class CreateTripRequestDto {
  @IsString()
  @IsNotEmpty()
  requesterName!: string;

  @IsEmail()
  requesterEmail!: string;

  @IsString()
  @IsNotEmpty()
  requesterPhone!: string;

  @IsUUID()
  tripId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DogDto)
  dogs!: DogDto[];
}
