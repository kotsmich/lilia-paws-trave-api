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
/** Postgres check_violation — paid methods exceeding the total, or a negative amount. */
const PG_CHECK_VIOLATION = '23514';

/** The entity's name column is varchar(120); a requester's is not bounded. */
const NAME_MAX_LENGTH = 120;

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
    await this.seedIncomeRows(tripId);
    return this.repo.find({
      where: { tripId, dismissed: false },
      order: { type: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Gives every adopter on the trip an income row to be filled in.
   *
   * Runs on read rather than once at trip creation, so an adopter whose dogs
   * are added days later still gets a row. A dismissed row counts as present,
   * which is what stops a removed adopter from coming back on the next load.
   */
  private async seedIncomeRows(tripId: string): Promise<void> {
    const requesters = await this.requesterRepo.find({ where: { tripId } });
    if (!requesters.length) return;

    const incomes = await this.repo.find({
      where: { tripId, type: 'income' },
    });
    const claimed = new Set(
      incomes.map((entry) => entry.requesterId).filter((id): id is string => id !== null),
    );

    const missing = requesters.filter((requester) => !claimed.has(requester.id));
    if (!missing.length) return;

    const rows = missing.map((requester) =>
      this.repo.create({
        tripId,
        type: 'income' as const,
        name: requester.name.slice(0, NAME_MAX_LENGTH),
        amount: 0,
        requesterId: requester.id,
      }),
    );

    try {
      await this.repo.save(rows);
    } catch (error) {
      // Two requests seeding the same trip at once: the unique index settles
      // it and the loser can simply carry on — the rows exist either way.
      if ((error as { code?: string }).code !== PG_UNIQUE_VIOLATION) throw error;
    }
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
        throw new BadRequestException('Requester does not belong to this trip');
      }
    }

    const entry = this.repo.create({
      tripId,
      type: data.type,
      name: data.name,
      amount: data.amount,
      paidCash: data.paidCash ?? 0,
      paidPaypal: data.paidPaypal ?? 0,
      paidRevolut: data.paidRevolut ?? 0,
      paidCredia: data.paidCredia ?? 0,
      note: data.note ?? null,
      requesterId: data.requesterId ?? null,
    });

    return this.save(entry);
  }

  async update(
    tripId: string,
    entryId: string,
    data: UpdateTripFinanceEntryDto,
  ): Promise<TripFinanceEntry> {
    const entry = await this.findOne(tripId, entryId);
    if (data.name !== undefined) entry.name = data.name;
    if (data.amount !== undefined) entry.amount = data.amount;
    if (data.paidCash !== undefined) entry.paidCash = data.paidCash;
    if (data.paidPaypal !== undefined) entry.paidPaypal = data.paidPaypal;
    if (data.paidRevolut !== undefined) entry.paidRevolut = data.paidRevolut;
    if (data.paidCredia !== undefined) entry.paidCredia = data.paidCredia;
    if (data.note !== undefined) entry.note = data.note;
    return this.save(entry);
  }

  async remove(tripId: string, entryId: string): Promise<void> {
    const entry = await this.findOne(tripId, entryId);

    // A seeded adopter row would be re-created on the next read, so hide it
    // instead. Everything else — custom payers, expenses, payments — is gone
    // for good. Either way the requester and their dogs are untouched.
    if (entry.type === 'income' && entry.requesterId) {
      entry.dismissed = true;
      await this.repo.save(entry);
      return;
    }

    await this.repo.remove(entry);
  }

  /** Turns the table's constraints into errors the admin can act on. */
  private async save(entry: TripFinanceEntry): Promise<TripFinanceEntry> {
    try {
      return await this.repo.save(entry);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('This payer already has an income row');
      }
      if (code === PG_CHECK_VIOLATION) {
        // What's left to violate: a negative amount, or an unknown entry type.
        throw new BadRequestException('Amounts must be zero or more');
      }
      throw error;
    }
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
