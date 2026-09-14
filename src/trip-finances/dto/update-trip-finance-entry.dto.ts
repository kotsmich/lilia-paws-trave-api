import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Deliberately omits `type` and `requesterId`: the kind of row and the payer
 * link are fixed at creation. Changing a payer is delete + re-add, which keeps
 * the unique (tripId, requesterId) index and the type CHECK trivially valid.
 */
export class UpdateTripFinanceEntryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
