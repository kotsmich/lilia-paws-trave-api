import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/swagger';
import { CreateDogDto } from './create-dog.dto';

/** Per-dog shape for bulk creation — requester is set once at the group level. */
export class BulkDogDto extends OmitType(CreateDogDto, ['requesterId', 'newRequesterName'] as const) {}

export class BulkCreateDogDto {
  /** ID of an existing Requester to assign to all dogs in this batch. */
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  /** Creates a new Requester record and links all dogs in this batch to it. */
  @IsOptional()
  @IsString()
  newRequesterName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkDogDto)
  dogs!: BulkDogDto[];
}
