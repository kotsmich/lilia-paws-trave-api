import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripResult } from './trip-result.entity';
import { TripResultPhoto } from './trip-result-photo.entity';
import { TripResultsController } from './trip-results.controller';
import { TripResultsService } from './trip-results.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripResult, TripResultPhoto])],
  controllers: [TripResultsController],
  providers: [TripResultsService],
  exports: [TripResultsService],
})
export class TripResultsModule {}
