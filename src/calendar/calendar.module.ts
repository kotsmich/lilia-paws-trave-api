import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TripsModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
