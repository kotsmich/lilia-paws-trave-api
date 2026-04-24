import { IsString, IsIn, IsNumber, IsOptional, IsUUID, Min, Matches, IsArray, ArrayUnique } from 'class-validator';

export class CreateDogDto {
  @IsString()
  name: string;

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

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female' | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/)
  chipId?: string | null;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropLocation: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** ID of an existing Requester — used when assigning dog to an already-known requester. */
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  /** Name for a brand-new requester — backend will create a Requester record and link it. */
  @IsOptional()
  @IsString()
  newRequesterName?: string;

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
