import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TripResultPhoto } from './trip-result-photo.entity';

/**
 * A completed trip published to the public site as a photo gallery.
 * Deliberately independent of `Trip` — results can be published for journeys
 * that predate the app, and editing marketing content must never touch
 * capacity/requests on an operational trip.
 */
@Entity()
export class TripResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  date: string;

  @Column()
  departureCity: string;

  @Column()
  arrivalCity: string;

  @OneToMany(() => TripResultPhoto, (photo) => photo.tripResult, {
    cascade: true,
    eager: true,
  })
  photos: TripResultPhoto[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
