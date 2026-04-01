import { IsArray, IsUUID } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}
