import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripRequest } from './trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Dog } from '../dogs/dog.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(TripRequest) private repo: Repository<TripRequest>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Dog) private dogRepo: Repository<Dog>,
  ) {}

  findAll(): Promise<TripRequest[]> {
    return this.repo.find({ relations: ['trip'], order: { submittedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<TripRequest> {
    const req = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  async create(data: Partial<TripRequest>): Promise<TripRequest> {
    const req = this.repo.create(data);
    return this.repo.save(req);
  }

  async updateStatus(id: string, status: TripRequest['status']): Promise<TripRequest> {
    const req = await this.findOne(id);
    req.status = status;
    return this.repo.save(req);
  }

  async approveRequest(id: string): Promise<{ request: TripRequest; trip: Trip }> {
    const req = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!req) throw new NotFoundException('Request not found');

    const trip = await this.tripRepo.findOne({ where: { id: req.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    // Persist each dog from the request JSON as a new Dog entity linked to the trip
    const newDogs = this.dogRepo.create(
      req.dogs.map((d) => ({
        name: d.name,
        size: d.size as 'small' | 'medium' | 'large',
        age: d.age,
        chipId: d.chipId,
        pickupLocation: d.pickupLocation,
        dropLocation: d.dropLocation,
        notes: d.notes,
        trip,
      })),
    );
    await this.dogRepo.save(newDogs);

    // Decrement available spots — use update() to avoid cascade side-effects on the dogs relation
    await this.tripRepo.update(trip.id, {
      spotsAvailable: Math.max(0, trip.spotsAvailable - req.dogs.length),
    });

    // Reload trip with its updated dogs
    const updatedTrip = await this.tripRepo.findOneOrFail({ where: { id: trip.id }, relations: ['dogs'] });

    // Mark request as approved
    req.status = 'approved';
    const savedReq = await this.repo.save(req);

    return { request: savedReq, trip: updatedTrip };
  }

  async reject(id: string): Promise<TripRequest> {
    return this.updateStatus(id, 'rejected');
  }

  async deleteRequest(id: string): Promise<void> {
    const req = await this.findOne(id);
    if (req.status === 'pending') {
      throw new BadRequestException('Cannot delete a pending request. Approve or reject it first.');
    }
    await this.repo.delete(id);
  }
}
