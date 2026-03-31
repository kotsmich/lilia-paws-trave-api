import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { TripRequest } from './trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Dog } from '../dogs/dog.entity';
import { CreateTripRequestDto } from './create-trip-request.dto';
import { AppGateway } from '../gateway/app.gateway';
import { TripsGateway } from '../trips/trips.gateway';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(TripRequest) private repo: Repository<TripRequest>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Dog) private dogRepo: Repository<Dog>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly appGateway: AppGateway,
    private readonly tripsGateway: TripsGateway,
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  /** Retrieve all requests with trip relation, ordered by most recent. */
  findAll(): Promise<TripRequest[]> {
    return this.repo.find({ relations: ['trip'], order: { submittedAt: 'DESC' } });
  }

  /** Retrieve a single request by ID. */
  async findOne(id: string): Promise<TripRequest> {
    const req = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  /** Create a new trip request from validated DTO data. */
  async create(data: CreateTripRequestDto): Promise<TripRequest> {
    const req = this.repo.create({
      requesterName: data.requesterName,
      requesterEmail: data.requesterEmail,
      requesterPhone: data.requesterPhone,
      tripId: data.tripId,
      dogs: data.dogs,
    });
    const saved = await this.repo.save(req);

    this.appGateway.emitNewRequest(saved);

    try {
      await this.mailerService.sendMail({
        to: this.config.get<string>('MAIL_TO', 'noreply@liliapawstravel.com'),
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
      this.logger.error('Failed to send new request email', err);
    }

    return saved;
  }

  /** Update the status of a request. */
  async updateStatus(id: string, status: TripRequest['status']): Promise<TripRequest> {
    const req = await this.findOne(id);
    req.status = status;
    const saved = await this.repo.save(req);
    this.appGateway.emitRequestStatusUpdated(saved);
    return saved;
  }

  /** Approve a request: add dogs to trip in a transaction and update capacity. */
  async approveRequest(id: string): Promise<{ request: TripRequest; trip: Trip }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const req = await queryRunner.manager.findOne(TripRequest, {
        where: { id },
        relations: ['trip'],
      });
      if (!req) throw new NotFoundException('Request not found');

      const trip = await queryRunner.manager.findOne(Trip, { where: { id: req.tripId } });
      if (!trip) throw new NotFoundException('Trip not found');

      if (!trip.acceptingRequests) {
        throw new BadRequestException('Trip is not accepting requests');
      }
      if (trip.isFull) {
        throw new BadRequestException('Trip is full');
      }
      if (trip.spotsAvailable < req.dogs.length) {
        throw new BadRequestException('Not enough spots available');
      }

      // Persist each dog from the request JSON as a new Dog entity linked to the trip
      const newDogs = queryRunner.manager.create(
        Dog,
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
      await queryRunner.manager.save(Dog, newDogs);

      // Reload dogs count within transaction
      const dogsInTrip = await queryRunner.manager.find(Dog, { where: { trip: { id: trip.id } } });
      const newSpotsAvailable = Math.max(0, trip.spotsAvailable - req.dogs.length);
      const isFull = dogsInTrip.length >= trip.totalCapacity;

      // Update trip capacity fields
      await queryRunner.manager.update(Trip, trip.id, {
        spotsAvailable: isFull ? 0 : newSpotsAvailable,
        isFull,
      });

      // Mark request as approved
      req.status = 'approved';
      const savedReq = await queryRunner.manager.save(TripRequest, req);

      // Reload trip with updated dogs inside transaction
      const updatedTrip = await queryRunner.manager.findOneOrFail(Trip, {
        where: { id: trip.id },
        relations: ['dogs'],
      });

      await queryRunner.commitTransaction();

      // Emit events after successful commit
      this.appGateway.emitRequestStatusUpdated(savedReq);
      await this.tripsGateway.broadcastTrips();

      return { request: savedReq, trip: updatedTrip };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Reject a request by setting its status to rejected. */
  async reject(id: string): Promise<TripRequest> {
    return this.updateStatus(id, 'rejected');
  }

  /** Soft-delete a request (only non-pending). */
  async deleteRequest(id: string): Promise<void> {
    const req = await this.findOne(id);
    if (req.status === 'pending') {
      throw new BadRequestException('Cannot delete a pending request. Approve or reject it first.');
    }
    await this.repo.softDelete(id);
  }
}
