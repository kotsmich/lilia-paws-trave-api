import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Trip } from './trip.entity';

@Entity()
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Trip, (trip) => trip.destinations, { onDelete: 'CASCADE' })
  trip: Trip;
}
