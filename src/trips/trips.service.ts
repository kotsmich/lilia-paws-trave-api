import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { TripsGateway } from './trips.gateway';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private repo: Repository<Trip>,
    @Inject(forwardRef(() => TripsGateway))
    private readonly tripsGateway: TripsGateway,
  ) {}

  findAll(): Promise<Trip[]> {
    return this.repo.find({ relations: ['dogs'] });
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.repo.findOne({ where: { id }, relations: ['dogs', 'requests'] });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async create(data: Partial<Trip>): Promise<Trip> {
    const trip = this.repo.create(data);
    return this.repo.save(trip);
  }

  async update(id: string, data: Partial<Trip>): Promise<Trip> {
    const trip = await this.findOne(id);
    Object.assign(trip, data);
    // When dogs reach capacity, auto-lock and prevent manual override
    // When below capacity, respect admin's manual isFull choice
    const dogsCount = Array.isArray(trip.dogs) ? trip.dogs.length : 0;
    if (dogsCount >= trip.totalCapacity) {
      trip.isFull = true;
    }
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    const saved = await this.repo.save(trip);
    await this.tripsGateway.broadcastTrips();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const trip = await this.findOne(id);
    await this.repo.remove(trip);
    await this.tripsGateway.broadcastTrips();
  }
}
