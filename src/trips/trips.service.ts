import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { TripsGateway } from './trips.gateway';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip) private repo: Repository<Trip>,
    @Inject(forwardRef(() => TripsGateway))
    private readonly tripsGateway: TripsGateway,
  ) {}

  /** Retrieve all trips with their dogs. */
  findAll(): Promise<Trip[]> {
    return this.repo.find({ relations: ['dogs'] });
  }

  /** Retrieve a single trip by ID with dogs and requests. */
  async findOne(id: string): Promise<Trip> {
    const trip = await this.repo.findOne({ where: { id }, relations: ['dogs', 'requests'] });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  /** Create a new trip from validated DTO data. */
  async create(data: CreateTripDto): Promise<Trip> {
    const trip = this.repo.create({
      ...data,
      spotsAvailable: data.totalCapacity,
      isFull: false,
    });
    return this.repo.save(trip);
  }

  /** Broadcast the current trip list to all WebSocket clients after a create. */
  async broadcastAfterCreate(): Promise<void> {
    await this.tripsGateway.broadcastTrips();
  }

  /** Update a trip using only whitelisted DTO fields. */
  async update(id: string, data: UpdateTripDto): Promise<Trip> {
    const trip = await this.findOne(id);

    // Whitelist-based update: only apply fields present in the DTO
    if (data.date !== undefined) trip.date = data.date;
    if (data.departureCountry !== undefined) trip.departureCountry = data.departureCountry;
    if (data.departureCity !== undefined) trip.departureCity = data.departureCity;
    if (data.arrivalCountry !== undefined) trip.arrivalCountry = data.arrivalCountry;
    if (data.arrivalCity !== undefined) trip.arrivalCity = data.arrivalCity;
    if (data.status !== undefined) trip.status = data.status;
    if (data.notes !== undefined) trip.notes = data.notes;
    if (data.totalCapacity !== undefined) trip.totalCapacity = data.totalCapacity;
    if (data.acceptingRequests !== undefined) trip.acceptingRequests = data.acceptingRequests;

    const dogsCount = Array.isArray(trip.dogs) ? trip.dogs.length : 0;
    if (dogsCount >= trip.totalCapacity) {
      trip.isFull = true;
    }
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    const saved = await this.repo.save(trip);
    await this.tripsGateway.broadcastTrips();
    return saved;
  }

  /** Remove a trip by ID and broadcast the update. */
  async remove(id: string): Promise<void> {
    const trip = await this.findOne(id);
    await this.repo.remove(trip);
    await this.tripsGateway.broadcastTrips();
  }
}
