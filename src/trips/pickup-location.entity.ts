import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Trip } from './trip.entity';

@Entity()
export class PickupLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Trip, (trip) => trip.pickupLocations, { onDelete: 'CASCADE' })
  trip: Trip;
}
