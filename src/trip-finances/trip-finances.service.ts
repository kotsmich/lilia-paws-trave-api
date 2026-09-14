import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripFinanceEntry } from './trip-finance-entry.entity';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';
import { CreateTripFinanceEntryDto } from './dto/create-trip-finance-entry.dto';
import { UpdateTripFinanceEntryDto } from './dto/update-trip-finance-entry.dto';

/** Postgres unique_violation — the (tripId, requesterId) partial unique index. */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class TripFinancesService {
  constructor(
    @InjectRepository(TripFinanceEntry)
    private repo: Repository<TripFinanceEntry>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Requester) private requesterRepo: Repository<Requester>,
  ) {}

  async findAll(tripId: string): Promise<TripFinanceEntry[]> {
    await this.assertTripExists(tripId);
    return this.repo.find({
      where: { tripId },
      order: { type: 'ASC', createdAt: 'ASC' },
    });
  }

  async create(
    tripId: string,
    data: CreateTripFinanceEntryDto,
  ): Promise<TripFinanceEntry> {
    await this.assertTripExists(tripId);

    if (data.requesterId) {
      // Expenses and payments are generic lines with no payer link.
      if (data.type !== 'income') {
        throw new BadRequestException(
          'Only income entries can be linked to a requester',
        );
      }
      const requester = await this.requesterRepo.findOne({
        where: { id: data.requesterId },
      });
      if (!requester || requester.tripId !== tripId) {
        throw new BadRequestException(
          'Requester does not belong to this trip',
        );
      }
    }

    const entry = this.repo.create({
      tripId,
      type: data.type,
      name: data.name,
      amount: data.amount,
      note: data.note ?? null,
      requesterId: data.requesterId ?? null,
    });

    try {
      return await this.repo.save(entry);
    } catch (error) {
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('This payer already has an income row');
      }
      throw error;
    }
  }

  async update(
    tripId: string,
    entryId: string,
    data: UpdateTripFinanceEntryDto,
  ): Promise<TripFinanceEntry> {
    const entry = await this.findOne(tripId, entryId);
    if (data.name !== undefined) entry.name = data.name;
    if (data.amount !== undefined) entry.amount = data.amount;
    if (data.note !== undefined) entry.note = data.note;
    return this.repo.save(entry);
  }

  async remove(tripId: string, entryId: string): Promise<void> {
    const entry = await this.findOne(tripId, entryId);
    await this.repo.remove(entry);
  }

  /** Scoped by tripId so an entry id from another trip can never be touched. */
  private async findOne(
    tripId: string,
    entryId: string,
  ): Promise<TripFinanceEntry> {
    const entry = await this.repo.findOne({
      where: { id: entryId, tripId },
    });
    if (!entry) throw new NotFoundException('Finance entry not found');
    return entry;
  }

  private async assertTripExists(tripId: string): Promise<void> {
    const count = await this.tripRepo.countBy({ id: tripId });
    if (count === 0) throw new NotFoundException('Trip not found');
  }
}
