import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './trip.entity';

@Injectable()
export class TripsService {
  constructor(@InjectRepository(Trip) private repo: Repository<Trip>) {}

  findAll(): Promise<Trip[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.repo.findOne({ where: { id } });
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
    return this.repo.save(trip);
  }

  async remove(id: string): Promise<void> {
    const trip = await this.findOne(id);
    await this.repo.remove(trip);
  }
}
