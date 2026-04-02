import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { Trip } from './trip.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { PublicTripDto } from './dto/public-trip.dto';
import { DogsService } from '../dogs/dogs.service';
import { Dog } from '../dogs/dog.entity';
import { CreateDogDto } from '../dogs/create-dog.dto';
import { BulkCreateDogDto } from '../dogs/bulk-create-dog.dto';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly dogsService: DogsService,
  ) {}

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
  @ApiOperation({ summary: 'Add a dog to a trip' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/dogs')
  async addDog(@Param('id') id: string, @Body() body: CreateDogDto): Promise<Dog> {
    const dog = await this.dogsService.create(id, body);
    await this.tripsService.recalculateSpotsAfterDogChange(id);
    return dog;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add multiple dogs to a trip' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/dogs/bulk')
  async addDogs(@Param('id') id: string, @Body() body: BulkCreateDogDto): Promise<Dog[]> {
    const dogs = await this.dogsService.createMany(id, body.dogs);
    await this.tripsService.recalculateSpotsAfterDogChange(id);
    return dogs;
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
