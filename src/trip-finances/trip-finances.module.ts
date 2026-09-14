import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripFinanceEntry } from './trip-finance-entry.entity';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';
import { TripFinancesController } from './trip-finances.controller';
import { TripFinancesService } from './trip-finances.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripFinanceEntry, Trip, Requester])],
  controllers: [TripFinancesController],
  providers: [TripFinancesService],
  exports: [TripFinancesService],
})
export class TripFinancesModule {}
