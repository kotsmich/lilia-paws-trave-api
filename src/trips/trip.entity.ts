import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Dog } from '../dogs/dog.entity';
import { TripRequest } from '../requests/trip-request.entity';
import { Destination } from './destination.entity';
import { PickupLocation } from './pickup-location.entity';

export type TripDestination = { id: string; name: string };

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  date: string;

  @Column()
  departureCountry: string;

  @Column()
  departureCity: string;

  @Column()
  arrivalCountry: string;

  @Column()
  arrivalCity: string;

  @Index()
  @Column({ default: 'upcoming' })
  status: 'upcoming' | 'in-progress' | 'completed';

  @Column({ nullable: true })
  notes: string;

  @Column()
  totalCapacity: number;

  @Column({ default: 0 })
  spotsAvailable: number;

  @Column({ default: false })
  isFull: boolean;

  @Column({ default: true })
  acceptingRequests: boolean;

  @OneToMany(() => Destination, (d) => d.trip, { cascade: ['insert'], eager: true })
  destinations: Destination[];

  @OneToMany(() => PickupLocation, (p) => p.trip, { cascade: ['insert'], eager: true })
  pickupLocations: PickupLocation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Dog, (dog) => dog.trip, { cascade: true })
  dogs: Dog[];

  @OneToMany(() => TripRequest, (req) => req.trip)
  requests: TripRequest[];
}
