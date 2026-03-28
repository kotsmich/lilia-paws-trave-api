import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip } from './trip.entity';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findAll(): Promise<Trip[]> {
    return this.tripsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Trip> {
    return this.tripsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Trip>): Promise<Trip> {
    return this.tripsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Trip>): Promise<Trip> {
    return this.tripsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tripsService.remove(id);
  }
}
