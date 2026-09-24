import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
// `import type` is required: the decorated `type` property below would
// otherwise emit a runtime metadata reference to a type-only export.
import type { TripFinanceEntryType } from '../trip-finance-entry.entity';

export class CreateTripFinanceEntryDto {
  @IsIn(['expense', 'income', 'payment'])
  type!: TripFinanceEntryType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  /** For an income, what the payer owes in total. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  /** Incomes only: how much of the total arrived by each method. */
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

  /** Incomes only; must reference a requester attached to this trip. */
  @IsOptional()
  @IsUUID()
  requesterId?: string;
}
