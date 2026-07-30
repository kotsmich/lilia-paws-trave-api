import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { TripResult } from './trip-result.entity';

@Entity()
export class TripResultPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Public URL under /api/uploads/trip-results/. */
  @Column()
  url: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Index()
  @Column({ type: 'uuid' })
  tripResultId: string;

  @ManyToOne(() => TripResult, (result) => result.photos, {
    onDelete: 'CASCADE',
  })
  tripResult: TripResult;
}
