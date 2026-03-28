import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { TripRequest } from './trip-request.entity';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(): Promise<TripRequest[]> {
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<TripRequest>): Promise<TripRequest> {
    return this.requestsService.create(body);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.approve(id);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.reject(id);
  }
}
