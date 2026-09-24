import {
  TripFinanceEntry,
  TripFinanceEntryType,
} from '../trip-finance-entry.entity';

export class PublicTripFinanceEntryDto {
  id: string;
  tripId: string;
  type: TripFinanceEntryType;
  name: string;
  amount: number;
  paidCash: number;
  paidPaypal: number;
  paidRevolut: number;
  paidCredia: number;
  note: string | null;
  requesterId: string | null;
  createdAt: Date;

  static from(entry: TripFinanceEntry): PublicTripFinanceEntryDto {
    const dto = new PublicTripFinanceEntryDto();
    dto.id = entry.id;
    dto.tripId = entry.tripId;
    dto.type = entry.type;
    dto.name = entry.name;
    dto.amount = Number(entry.amount);
    dto.paidCash = Number(entry.paidCash);
    dto.paidPaypal = Number(entry.paidPaypal);
    dto.paidRevolut = Number(entry.paidRevolut);
    dto.paidCredia = Number(entry.paidCredia);
    dto.note = entry.note;
    dto.requesterId = entry.requesterId;
    dto.createdAt = entry.createdAt;
    return dto;
  }
}
