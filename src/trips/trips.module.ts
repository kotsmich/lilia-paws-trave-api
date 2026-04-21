import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './trip.entity';
import { TripRequest } from '../requests/trip-request.entity';
import { Destination } from './destination.entity';
import { PickupLocation } from './pickup-location.entity';
import { Requester } from '../requesters/requester.entity';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripsGateway } from './trips.gateway';
import { DogsModule } from '../dogs/dogs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripRequest, Destination, PickupLocation, Requester]), DogsModule],
  controllers: [TripsController],
  providers: [TripsService, TripsGateway],
  exports: [TripsService, TripsGateway],
})
export class TripsModule {}
