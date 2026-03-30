import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { TripRequest } from './trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Dog } from '../dogs/dog.entity';
import { AppGateway } from '../gateway/app.gateway';
import { TripsGateway } from '../trips/trips.gateway';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(TripRequest) private repo: Repository<TripRequest>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Dog) private dogRepo: Repository<Dog>,
    private readonly appGateway: AppGateway,
    private readonly tripsGateway: TripsGateway,
    private readonly mailerService: MailerService,
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
    const saved = await this.repo.save(req);

    this.appGateway.emitNewRequest(saved);

    try {
      await this.mailerService.sendMail({
        to: process.env['MAIL_TO'] ?? 'liliapawstravel@gmail.com',
        subject: `New Trip Request from ${saved.requesterName}`,
        template: 'new-request',
        context: {
          requesterName: saved.requesterName,
          requesterEmail: saved.requesterEmail,
          requesterPhone: saved.requesterPhone,
          dogsCount: saved.dogs?.length ?? 0,
          submittedAt: new Date(saved.submittedAt).toLocaleString(),
        },
      });
    } catch (err) {
      console.error('Failed to send new request email:', err);
    }

    return saved;
  }

  async updateStatus(id: string, status: TripRequest['status']): Promise<TripRequest> {
    const req = await this.findOne(id);
    req.status = status;
    const saved = await this.repo.save(req);
    this.appGateway.emitRequestStatusUpdated(saved);
    return saved;
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

    if (updatedTrip.dogs.length >= updatedTrip.totalCapacity) {
      await this.tripRepo.update(trip.id, { isFull: true, spotsAvailable: 0 });
    }

    // Mark request as approved
    req.status = 'approved';
    const savedReq = await this.repo.save(req);

    this.appGateway.emitRequestStatusUpdated(savedReq);
    await this.tripsGateway.broadcastTrips();

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
