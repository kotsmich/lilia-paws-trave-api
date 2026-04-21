import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRequest } from './trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Dog } from '../dogs/dog.entity';
import { Requester } from '../requesters/requester.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TypeOrmModule.forFeature([TripRequest, Trip, Dog, Requester]), TripsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
