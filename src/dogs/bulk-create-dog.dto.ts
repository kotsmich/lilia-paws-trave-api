import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDogDto } from './create-dog.dto';

export class BulkCreateDogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDogDto)
  dogs!: CreateDogDto[];
}
