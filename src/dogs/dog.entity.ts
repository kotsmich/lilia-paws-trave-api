import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, Index } from 'typeorm';
import { Trip } from '../trips/trip.entity';

@Entity()
export class Dog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  size: 'small' | 'medium' | 'large';

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

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Trip, (trip) => trip.dogs, { onDelete: 'CASCADE' })
  trip: Trip;
}
