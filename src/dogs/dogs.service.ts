import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dog } from './dog.entity';
import { Trip } from '../trips/trip.entity';
import { Requester } from '../requesters/requester.entity';
import { CreateDogDto } from './create-dog.dto';
import { BulkCreateDogDto } from './bulk-create-dog.dto';
import { UpdateDogDto } from './update-dog.dto';

@Injectable()
export class DogsService {
  constructor(
    @InjectRepository(Dog) private repo: Repository<Dog>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Requester) private requesterRepo: Repository<Requester>,
  ) {}

  private async recalculateTrip(tripId: string): Promise<void> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId }, relations: ['dogs'] });
    if (!trip) return;
    const dogsCount = trip.dogs.length;
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    trip.isFull = dogsCount >= trip.totalCapacity;
    await this.tripRepo.save(trip);
  }

  /** Create a Requester entry for an admin-added dog (no originating TripRequest). */
  async createAdminRequester(tripId: string, name: string): Promise<Requester> {
    const requester = this.requesterRepo.create({
      name,
      email: null,
      phone: null,
      tripId,
      sourceRequestId: null,
    });
    return this.requesterRepo.save(requester);
  }

  /** Create a new dog and associate it with a trip. */
  async create(tripId: string, data: CreateDogDto): Promise<Dog> {
    const { newRequesterName, requesterId: dtoRequesterId, ...dogData } = data;

    let resolvedRequesterId: string | null = dtoRequesterId ?? null;

    if (newRequesterName) {
      const requester = await this.createAdminRequester(tripId, newRequesterName);
      resolvedRequesterId = requester.id;
    }

    const dog = this.repo.create({
      ...dogData,
      requesterId: resolvedRequesterId,
      trip: { id: tripId } as any,
    });
    const saved = await this.repo.save(dog);
    await this.recalculateTrip(tripId);
    return saved;
  }

  /** Bulk-create multiple dogs and associate them with a trip, all sharing one requester. */
  async createMany(tripId: string, data: BulkCreateDogDto): Promise<Dog[]> {
    let resolvedRequesterId: string | null = data.requesterId ?? null;

    if (data.newRequesterName) {
      const requester = await this.createAdminRequester(tripId, data.newRequesterName);
      resolvedRequesterId = requester.id;
    }

    const dogs = this.repo.create(
      data.dogs.map(dogData => ({
        ...dogData,
        requesterId: resolvedRequesterId,
        trip: { id: tripId } as any,
      })),
    );
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

  /** Update a dog's photo URL. */
  async updatePhoto(id: string, photoUrl: string): Promise<Dog> {
    await this.repo.update(id, { photoUrl });
    return this.findOne(id);
  }

  /** Update a dog's document URL and type. */
  async updateDocument(id: string, documentUrl: string, documentType: string | null): Promise<Dog> {
    await this.repo.update(id, { documentUrl, documentType });
    return this.findOne(id);
  }

  /** Update a dog using only whitelisted DTO fields. */
  async update(id: string, data: UpdateDogDto): Promise<Dog> {
    const { newRequesterName, ...rest } = data;
    const dog = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!dog) throw new NotFoundException('Dog not found');

    if (newRequesterName?.trim()) {
      const tripId = dog.trip?.id;
      if (tripId) {
        const requester = await this.createAdminRequester(tripId, newRequesterName.trim());
        dog.requesterId = requester.id;
      }
    } else if (rest.requesterId !== undefined) {
      dog.requesterId = rest.requesterId ?? null;
    }

    if (rest.name !== undefined) dog.name = rest.name;
    if (rest.size !== undefined) dog.size = rest.size;
    if (rest.height !== undefined) dog.height = rest.height ?? null;
    if (rest.behaviors !== undefined) dog.behaviors = rest.behaviors && rest.behaviors.length > 0 ? rest.behaviors : null;
    if (rest.gender !== undefined) dog.gender = rest.gender;
    if (rest.age !== undefined) dog.age = rest.age;
    if (rest.chipId !== undefined) dog.chipId = rest.chipId;
    if (rest.pickupLocation !== undefined) dog.pickupLocation = rest.pickupLocation;
    if (rest.dropLocation !== undefined) dog.dropLocation = rest.dropLocation;
    if (rest.notes !== undefined) dog.notes = rest.notes;
    if (rest.photoUrl !== undefined) dog.photoUrl = rest.photoUrl ?? null;
    if (rest.documentUrl !== undefined) dog.documentUrl = rest.documentUrl ?? null;
    if (rest.destinationId !== undefined) dog.destinationId = rest.destinationId ?? null;
    if (rest.pickupLocationId !== undefined) dog.pickupLocationId = rest.pickupLocationId ?? null;
    if (rest.receiver !== undefined) dog.receiver = rest.receiver ?? null;
    if (rest.receiverPhone !== undefined) dog.receiverPhone = rest.receiverPhone ?? null;
    return this.repo.save(dog);
  }
}
