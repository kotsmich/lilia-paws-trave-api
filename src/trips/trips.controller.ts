import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsGateway } from './trips.gateway';
import { Trip } from './trip.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly tripsGateway: TripsGateway,
  ) {}

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
    await this.tripsGateway.broadcastTrips();
    return trip;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Trip>): Promise<Trip> {
    const trip = await this.tripsService.update(id, body);
    await this.tripsGateway.broadcastTrips();
    return trip;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.tripsService.remove(id);
    await this.tripsGateway.broadcastTrips();
    return { id };
  }
}
