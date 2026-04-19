import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, Index } from 'typeorm';
import { Trip } from '../trips/trip.entity';
import { TripRequest } from '../requests/trip-request.entity';
import { Destination } from '../trips/destination.entity';
import { PickupLocation } from '../trips/pickup-location.entity';

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

  @Column({ nullable: true, type: 'varchar' })
  destinationId: string | null;

  @ManyToOne(() => Destination, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destinationId' })
  destination: Destination | null;

  @Column({ nullable: true, type: 'varchar' })
  pickupLocationId: string | null;

  @ManyToOne(() => PickupLocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pickupLocationId' })
  tripPickupLocation: PickupLocation | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  requesterName: string | null;

  @Column({ type: 'text', nullable: true })
  requesterEmail: string | null;

  @Column({ type: 'text', nullable: true })
  requesterPhone: string | null;

  @ManyToOne(() => Trip, (trip) => trip.dogs, { onDelete: 'CASCADE', nullable: true })
  trip: Trip | null;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  requestId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  receiver: string | null;

  @ManyToOne(() => TripRequest, (r) => r.dogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestId' })
  request: TripRequest | null;
}
