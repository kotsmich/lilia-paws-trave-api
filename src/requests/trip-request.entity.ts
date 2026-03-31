import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Trip } from '../trips/trip.entity';

@Entity()
export class TripRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  submittedAt: Date;

  // Soft-delete: records are hidden from queries unless withDeleted() is used
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @Column()
  requesterName: string;

  @Column()
  requesterEmail: string;

  @Column()
  requesterPhone: string;

  @Index()
  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column('simple-json')
  dogs: Array<{
    id?: string;
    name: string;
    size: string;
    age: number;
    chipId: string;
    pickupLocation: string;
    dropLocation: string;
    notes?: string;
  }>;

  @ManyToOne(() => Trip, (trip) => trip.requests, { onDelete: 'SET NULL', nullable: true })
  trip: Trip;

  @Index()
  @Column({ nullable: true })
  tripId: string;
}
