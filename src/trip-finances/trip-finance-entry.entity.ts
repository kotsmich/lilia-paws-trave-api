import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';

/**
 * `payment` is an outgoing log — what we handed over and to whom. It is
 * deliberately NOT part of the income/expense/profit arithmetic.
 */
export type TripFinanceEntryType = 'expense' | 'income' | 'payment';

/**
 * Postgres `numeric` arrives in JS as a string. Without this the API would
 * serialise amounts as `"12.50"` and every consumer would have to re-parse.
 */
const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string | null): number => (value === null ? 0 : Number(value)),
};

/**
 * A single money line on a trip — either a generic expense (fuel, vet papers)
 * or an income from a payer. Incomes may be linked to a `Requester`; expenses
 * never are (enforced by a CHECK constraint in the migration).
 */
@Entity()
@Index(['tripId', 'type'])
export class TripFinanceEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'varchar', length: 16 })
  type: TripFinanceEntryType;

  /**
   * Always populated. For requester-linked incomes this is a SNAPSHOT of the
   * requester's name at save time, so the row still reads correctly if that
   * requester later drops off the trip or is deleted — and so the admin can
   * rename the money row without touching the requester itself.
   */
  @Column({ type: 'varchar', length: 120 })
  name: string;

  /**
   * For an income this is what the payer owes in total; the four `paid*`
   * columns are what has actually arrived. For expenses and payments it is
   * simply the amount.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  /**
   * Incomes only: how the money actually arrived, split by method. The admin UI
   * caps each one at whatever the total still leaves, but the sum is allowed to
   * exceed `amount` at the database level — lowering a total after money has
   * been collected must not be blocked. Expenses and payments leave all four at 0.
   */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  paidCash: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  paidPaypal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  paidRevolut: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  paidCredia: number;

  /**
   * Income rows are seeded from the trip's requesters, so hard-deleting one
   * would bring it straight back on the next load. Dismissing hides it for
   * good while leaving the requester and their dogs untouched.
   */
  @Column({ type: 'boolean', default: false })
  dismissed: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  /** Incomes only. NULL for expenses, payments, and custom (non-requestor) payers. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  requesterId: string | null;

  @ManyToOne(() => Requester, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requesterId' })
  requester: Requester | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
