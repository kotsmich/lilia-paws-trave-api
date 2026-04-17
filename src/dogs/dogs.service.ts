import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dog } from './dog.entity';
import { Trip } from '../trips/trip.entity';
import { TripRequest } from '../requests/trip-request.entity';
import { CreateDogDto } from './create-dog.dto';
import { UpdateDogDto } from './update-dog.dto';

@Injectable()
export class DogsService {
  constructor(
    @InjectRepository(Dog) private repo: Repository<Dog>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(TripRequest) private tripRequestRepo: Repository<TripRequest>,
  ) {}

  private async recalculateTrip(tripId: string): Promise<void> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId }, relations: ['dogs'] });
    if (!trip) return;
    const dogsCount = trip.dogs.length;
    trip.spotsAvailable = Math.max(0, trip.totalCapacity - dogsCount);
    trip.isFull = dogsCount >= trip.totalCapacity;
    await this.tripRepo.save(trip);
  }

  /** Create an admin-only TripRequest entry with just a name (no email/phone required). */
  private async createAdminRequester(tripId: string, name: string): Promise<TripRequest> {
    const requester = this.tripRequestRepo.create({
      requesterName: name,
      requesterEmail: null,
      requesterPhone: null,
      tripId,
      dogs: [],
      status: 'approved',
    });
    return this.tripRequestRepo.save(requester);
  }

  /** Create a new dog and associate it with a trip. */
  async create(tripId: string, data: CreateDogDto): Promise<Dog> {
    const { newRequesterName, requestId: dtoRequestId, ...dogData } = data;

    let resolvedRequestId: string | null = dtoRequestId ?? null;
    let resolvedRequesterName = dogData.requesterName ?? null;

    if (newRequesterName) {
      const requester = await this.createAdminRequester(tripId, newRequesterName);
      resolvedRequestId = requester.id;
      resolvedRequesterName = newRequesterName;
    }

    const dog = this.repo.create({
      ...dogData,
      requesterName: resolvedRequesterName,
      requestId: resolvedRequestId,
      trip: { id: tripId } as any,
    });
    const saved = await this.repo.save(dog);
    await this.recalculateTrip(tripId);
    return saved;
  }

  /** Bulk-create multiple dogs and associate them with a trip. */
  async createMany(tripId: string, data: CreateDogDto[]): Promise<Dog[]> {
    // Group unique newRequesterName values and create one TripRequest per unique name
    const nameToRequestId = new Map<string, string>();
    for (const item of data) {
      if (item.newRequesterName && !nameToRequestId.has(item.newRequesterName)) {
        const requester = await this.createAdminRequester(tripId, item.newRequesterName);
        nameToRequestId.set(item.newRequesterName, requester.id);
      }
    }

    const dogs = this.repo.create(
      data.map(({ newRequesterName, requestId: dtoRequestId, ...dogData }) => {
        let resolvedRequestId: string | null = dtoRequestId ?? null;
        let resolvedRequesterName = dogData.requesterName ?? null;

        if (newRequesterName) {
          resolvedRequestId = nameToRequestId.get(newRequesterName) ?? null;
          resolvedRequesterName = newRequesterName;
        }

        return {
          ...dogData,
          requesterName: resolvedRequesterName,
          requestId: resolvedRequestId,
          trip: { id: tripId } as any,
        };
      }),
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

  /** Null out destinationId on all dogs in a trip whose destination was removed. */
  async nullifyRemovedDestinations(tripId: string, removedIds: string[]): Promise<void> {
    if (!removedIds.length) return;
    await this.repo
      .createQueryBuilder()
      .update(Dog)
      .set({ destinationId: null })
      .where('tripId = :tripId AND destinationId IN (:...removedIds)', { tripId, removedIds })
      .execute();
  }

  /** Update a dog using only whitelisted DTO fields. */
  async update(id: string, data: UpdateDogDto): Promise<Dog> {
    const dog = await this.findOne(id);
    if (data.name !== undefined) dog.name = data.name;
    if (data.size !== undefined) dog.size = data.size;
    if (data.gender !== undefined) dog.gender = data.gender;
    if (data.age !== undefined) dog.age = data.age;
    if (data.chipId !== undefined) dog.chipId = data.chipId;
    if (data.pickupLocation !== undefined) dog.pickupLocation = data.pickupLocation;
    if (data.dropLocation !== undefined) dog.dropLocation = data.dropLocation;
    if (data.notes !== undefined) dog.notes = data.notes;
    if (data.requesterName !== undefined) dog.requesterName = data.requesterName ?? null;
    if (data.requesterEmail !== undefined) dog.requesterEmail = data.requesterEmail ?? null;
    if (data.requesterPhone !== undefined) dog.requesterPhone = data.requesterPhone ?? null;
    if (data.requestId !== undefined) dog.requestId = data.requestId ?? null;
    if (data.photoUrl !== undefined) dog.photoUrl = data.photoUrl ?? null;
    if (data.documentUrl !== undefined) dog.documentUrl = data.documentUrl ?? null;
    if (data.destinationId !== undefined) dog.destinationId = data.destinationId ?? null;
    if (data.receiver !== undefined) dog.receiver = data.receiver ?? null;
    return this.repo.save(dog);
  }
}
