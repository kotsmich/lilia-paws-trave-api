import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { TripsGateway } from './trips.gateway';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripDetailDto, RequesterEntry } from './dto/trip-detail.dto';

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

  /** Retrieve a trip for the admin detail view with requesters grouped by name. */
  async findOneDetail(id: string): Promise<TripDetailDto> {
    const trip = await this.findOne(id);

    const entries: RequesterEntry[] = [];

    // One entry per approved request that still has dogs, keyed by request.id
    for (const req of trip.requests.filter((r) => r.status === 'approved')) {
      const reqDogs = trip.dogs.filter((d) => d.requestId === req.id);
      if (reqDogs.length === 0) continue;
      entries.push({
        requestId: req.id,
        name: req.requesterName,
        dogs: reqDogs,
      });
    }

    // Manually added dogs (no requestId) grouped by requesterName
    const manualMap = new Map<string, RequesterEntry>();
    for (const dog of trip.dogs.filter((d) => d.requestId === null && d.requesterName !== null)) {
      const name = dog.requesterName as string;
      if (!manualMap.has(name)) manualMap.set(name, { requestId: null, name, dogs: [] });
      manualMap.get(name)!.dogs.push(dog);
    }
    entries.push(...manualMap.values());

    const dto = new TripDetailDto();
    dto.id = trip.id;
    dto.date = trip.date;
    dto.departureCountry = trip.departureCountry;
    dto.departureCity = trip.departureCity;
    dto.arrivalCountry = trip.arrivalCountry;
    dto.arrivalCity = trip.arrivalCity;
    dto.status = trip.status;
    dto.notes = trip.notes;
    dto.totalCapacity = trip.totalCapacity;
    dto.spotsAvailable = trip.spotsAvailable;
    dto.isFull = trip.isFull;
    dto.acceptingRequests = trip.acceptingRequests;
    dto.createdAt = trip.createdAt;
    dto.updatedAt = trip.updatedAt;
    dto.dogs = trip.dogs;
    dto.requesters = entries;

    return dto;
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
  async update(id: string, data: UpdateTripDto): Promise<TripDetailDto> {
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
    trip.isFull = dogsCount >= trip.totalCapacity;
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    await this.repo.save(trip);
    await this.tripsGateway.broadcastTrips();
    return this.findOneDetail(id);
  }

  /** Recalculate spotsAvailable/isFull after a dog is added or removed, then broadcast. */
  async recalculateSpotsAfterDogChange(tripId: string): Promise<void> {
    const trip = await this.findOne(tripId);
    const dogsCount = trip.dogs.length;
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    trip.isFull = dogsCount >= trip.totalCapacity;
    await this.repo.save(trip);
    await this.tripsGateway.broadcastTrips();
  }

  /** Remove a trip by ID and broadcast the update. */
  async remove(id: string): Promise<void> {
    const trip = await this.findOne(id);
    await this.repo.remove(trip);
    await this.tripsGateway.broadcastTrips();
  }
}
