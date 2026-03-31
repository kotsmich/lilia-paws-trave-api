import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { Trip } from './trip.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { PublicTripDto } from './dto/public-trip.dto';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiOperation({ summary: 'List all trips' })
  @Get()
  async findAll(): Promise<PublicTripDto[]> {
    const trips = await this.tripsService.findAll();
    return trips.map(PublicTripDto.from);
  }

  @ApiOperation({ summary: 'Get a trip by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PublicTripDto> {
    const trip = await this.tripsService.findOne(id);
    return PublicTripDto.from(trip);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get a trip with full dog list' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/detail')
  async findOneDetail(@Param('id') id: string): Promise<Trip> {
    return this.tripsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateTripDto): Promise<Trip> {
    const trip = await this.tripsService.create(body);
    await this.tripsService.broadcastAfterCreate();
    return trip;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a trip' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateTripDto): Promise<Trip> {
    return this.tripsService.update(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a trip' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.tripsService.remove(id);
    return { id };
  }
}
