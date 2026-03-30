import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip } from './trip.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: Partial<Trip>): Promise<Trip> {
    const trip = await this.tripsService.create(body);
    // broadcastTrips is called inside TripsService.update(); for create we broadcast here
    await this.tripsService.broadcastAfterCreate();
    return trip;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Trip>): Promise<Trip> {
    // TripsService.update() calls broadcastTrips internally
    return this.tripsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    // TripsService.remove() calls broadcastTrips internally
    await this.tripsService.remove(id);
    return { id };
  }
}
