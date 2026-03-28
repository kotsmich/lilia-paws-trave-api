import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRequest } from './trip-request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripRequest])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
