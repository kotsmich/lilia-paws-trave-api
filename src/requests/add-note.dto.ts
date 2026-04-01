import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
