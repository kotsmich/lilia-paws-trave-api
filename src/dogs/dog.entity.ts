import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, Index } from 'typeorm';
import { TripRequest } from '../requests/trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';
import { Destination } from '../trips/destination.entity';
import { PickupLocation } from '../trips/pickup-location.entity';

@Entity()
export class Dog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  size: 'small' | 'medium' | 'large' | null;

  @Column({ nullable: true, type: 'varchar' })
  gender: 'male' | 'female' | null;

  @Column({ nullable: true, type: 'int' })
  age: number | null;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  chipId: string | null;

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

  @ManyToOne(() => Trip, (trip) => trip.dogs, { onDelete: 'CASCADE', nullable: true })
  trip: Trip | null;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  requesterId: string | null;

  @ManyToOne(() => Requester, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requesterId' })
  requester: Requester | null;

  @Column({ nullable: true, type: 'varchar' })
  receiver: string | null;

  @Index()
  @Column({ nullable: true, type: 'varchar' })
  requestId: string | null;

  @ManyToOne(() => TripRequest, (r) => r.dogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestId' })
  request: TripRequest | null;
}
