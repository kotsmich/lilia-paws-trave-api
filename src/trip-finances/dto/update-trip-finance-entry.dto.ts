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
 *
 * `name` is editable even on a seeded adopter row — it renames the money line
 * only, never the requester behind it.
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
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidCash?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidPaypal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidRevolut?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidCredia?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
