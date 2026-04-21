import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Trip } from '../trips/trip.entity';
import { TripRequest } from '../requests/trip-request.entity';

@Entity()
export class Requester {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  tripId: string | null;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tripId' })
  trip: Trip | null;

  /** Set when the requester originated from a formal TripRequest (approval flow). Null for admin-created requesters. */
  @Column({ nullable: true, type: 'varchar' })
  sourceRequestId: string | null;

  @ManyToOne(() => TripRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sourceRequestId' })
  sourceRequest: TripRequest | null;
}
