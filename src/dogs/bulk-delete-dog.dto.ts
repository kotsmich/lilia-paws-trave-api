import { IsArray, IsUUID } from 'class-validator';

export class BulkDeleteDogDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}
