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
  ArrayUnique,
} from 'class-validator';

export class DogDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  size?: 'small' | 'medium' | 'large' | null;

  @IsOptional()
  @IsIn(['under10', '10to25', 'over30'])
  height?: 'under10' | '10to25' | 'over30' | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(['friendly', 'aggressive', 'fearful', 'anxious', 'calm'], { each: true })
  behaviors?: ('friendly' | 'aggressive' | 'fearful' | 'anxious' | 'calm')[] | null;

  @IsIn(['male', 'female'])
  gender!: 'male' | 'female';

  @IsNumber()
  @Min(0)
  age!: number;

  @IsOptional()
  @IsString()
  chipId?: string;

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

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;
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
