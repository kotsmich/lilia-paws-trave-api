import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Trip } from '../trips/trip.entity';

@Entity()
export class TripRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column()
  requesterName: string;

  @Column()
  requesterEmail: string;

  @Column()
  requesterPhone: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column('simple-json')
  dogs: Array<{
    id: string;
    name: string;
    size: string;
    age: number;
    chipId: string;
    pickupLocation: string;
    dropLocation: string;
    notes: string;
  }>;

  @ManyToOne(() => Trip, (trip) => trip.requests, { onDelete: 'SET NULL', nullable: true })
  trip: Trip;

  @Column({ nullable: true })
  tripId: string;
}
