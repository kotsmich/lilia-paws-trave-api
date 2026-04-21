import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dog } from './dog.entity';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';
import { DogsController } from './dogs.controller';
import { DogsService } from './dogs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dog, Trip, Requester])],
  controllers: [DogsController],
  providers: [DogsService],
  exports: [DogsService],
})
export class DogsModule {}
