import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dog } from './dog.entity';
import { Trip } from '../trips/trip.entity';
import { CreateDogDto } from './create-dog.dto';
import { UpdateDogDto } from './update-dog.dto';

@Injectable()
export class DogsService {
  constructor(
    @InjectRepository(Dog) private repo: Repository<Dog>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
  ) {}

  private async recalculateTrip(tripId: string): Promise<void> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId }, relations: ['dogs'] });
    if (!trip) return;
    const dogsCount = trip.dogs.length;
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    trip.isFull = dogsCount >= trip.totalCapacity;
    await this.tripRepo.save(trip);
  }

  /** Create a new dog and associate it with a trip. */
  async create(tripId: string, data: CreateDogDto): Promise<Dog> {
    const dog = this.repo.create({ ...data, trip: { id: tripId } as any });
    const saved = await this.repo.save(dog);
    await this.recalculateTrip(tripId);
    return saved;
  }

  /** Bulk-create multiple dogs and associate them with a trip. */
  async createMany(tripId: string, data: CreateDogDto[]): Promise<Dog[]> {
    const dogs = this.repo.create(data.map((d) => ({ ...d, trip: { id: tripId } as any })));
    const saved = await this.repo.save(dogs);
    await this.recalculateTrip(tripId);
    return saved;
  }

  /** Find a dog by ID. */
  async findOne(id: string): Promise<Dog> {
    const dog = await this.repo.findOne({ where: { id } });
    if (!dog) throw new NotFoundException('Dog not found');
    return dog;
  }

  /** Bulk-delete multiple dogs and recalculate the trip once. */
  async deleteMany(ids: string[]): Promise<{ deleted: string[] }> {
    const dogs = await this.repo.find({ where: { id: In(ids) }, relations: ['trip'] });
    const tripIds = new Set(dogs.map((d) => d.trip?.id).filter((id): id is string => !!id));
    const deletedIds = dogs.map((d) => d.id);
    await this.repo.remove(dogs);
    for (const tripId of tripIds) {
      await this.recalculateTrip(tripId);
    }
    return { deleted: deletedIds };
  }

  /** Delete a dog by ID. */
  async delete(id: string): Promise<void> {
    const dog = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!dog) throw new NotFoundException('Dog not found');
    const tripId = dog.trip?.id;
    await this.repo.remove(dog);
    if (tripId) await this.recalculateTrip(tripId);
  }

  /** Update a dog using only whitelisted DTO fields. */
  async update(id: string, data: UpdateDogDto): Promise<Dog> {
    const dog = await this.findOne(id);
    if (data.name !== undefined) dog.name = data.name;
    if (data.size !== undefined) dog.size = data.size;
    if (data.age !== undefined) dog.age = data.age;
    if (data.chipId !== undefined) dog.chipId = data.chipId;
    if (data.pickupLocation !== undefined) dog.pickupLocation = data.pickupLocation;
    if (data.dropLocation !== undefined) dog.dropLocation = data.dropLocation;
    if (data.notes !== undefined) dog.notes = data.notes;
    if (data.requesterName !== undefined) dog.requesterName = data.requesterName ?? null;
    if (data.requesterEmail !== undefined) dog.requesterEmail = data.requesterEmail ?? null;
    if (data.requesterPhone !== undefined) dog.requesterPhone = data.requesterPhone ?? null;
    return this.repo.save(dog);
  }
}
