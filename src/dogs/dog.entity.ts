import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, Index } from 'typeorm';
import { Trip } from '../trips/trip.entity';
import { TripRequest } from '../requests/trip-request.entity';

@Entity()
export class Dog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  size: 'small' | 'medium' | 'large';

  @Column()
  gender: 'male' | 'female';

  @Column()
  age: number;

  @Index()
  @Column()
  chipId: string;

  @Column()
  pickupLocation: string;

  @Column()
  dropLocation: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, type: 'varchar' })
  photoUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  documentUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  documentType: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  requesterName: string | null;

  @Column({ type: 'text', nullable: true })
  requesterEmail: string | null;

  @Column({ type: 'text', nullable: true })
  requesterPhone: string | null;

  @ManyToOne(() => Trip, (trip) => trip.dogs, { onDelete: 'CASCADE' })
  trip: Trip;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  requestId: string | null;

  @ManyToOne(() => TripRequest, { nullable: true, onDelete: 'SET NULL' })
  request: TripRequest | null;
}
