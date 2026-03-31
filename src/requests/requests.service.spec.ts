import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { RequestsService } from './requests.service';
import { TripRequest } from './trip-request.entity';
import { Trip } from '../trips/trip.entity';
import { Dog } from '../dogs/dog.entity';
import { AppGateway } from '../gateway/app.gateway';
import { TripsGateway } from '../trips/trips.gateway';

// ---------------------------------------------------------------------------
// Helpers: factories for mock entities
// ---------------------------------------------------------------------------

function makeTripRequest(overrides: Partial<TripRequest> = {}): TripRequest {
  return {
    id: 'req-1',
    submittedAt: new Date(),
    deletedAt: null,
    requesterName: 'John Doe',
    requesterEmail: 'john@example.com',
    requesterPhone: '+1234567890',
    status: 'pending',
    tripId: 'trip-1',
    trip: null as any,
    dogs: [
      {
        name: 'Buddy',
        size: 'medium',
        age: 3,
        chipId: 'CHIP001',
        pickupLocation: 'Berlin',
        dropLocation: 'Paris',
        notes: '',
      },
    ],
    ...overrides,
  } as TripRequest;
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    date: '2026-05-01',
    departureCountry: 'Germany',
    departureCity: 'Berlin',
    arrivalCountry: 'France',
    arrivalCity: 'Paris',
    status: 'upcoming',
    notes: '',
    totalCapacity: 10,
    spotsAvailable: 5,
    isFull: false,
    acceptingRequests: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    dogs: [],
    requests: [],
    ...overrides,
  } as Trip;
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };
}

function createMockQueryRunner() {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('RequestsService', () => {
  let service: RequestsService;
  let repo: ReturnType<typeof createMockRepository>;
  let tripRepo: ReturnType<typeof createMockRepository>;
  let dogRepo: ReturnType<typeof createMockRepository>;
  let queryRunner: ReturnType<typeof createMockQueryRunner>;
  let appGateway: { emitNewRequest: jest.Mock; emitRequestStatusUpdated: jest.Mock };
  let tripsGateway: { broadcastTrips: jest.Mock };
  let mailerService: { sendMail: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    repo = createMockRepository();
    tripRepo = createMockRepository();
    dogRepo = createMockRepository();
    queryRunner = createMockQueryRunner();

    appGateway = {
      emitNewRequest: jest.fn(),
      emitRequestStatusUpdated: jest.fn(),
    };
    tripsGateway = { broadcastTrips: jest.fn().mockResolvedValue(undefined) };
    mailerService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    configService = { get: jest.fn().mockReturnValue('admin@test.com') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(TripRequest), useValue: repo },
        { provide: getRepositoryToken(Trip), useValue: tripRepo },
        { provide: getRepositoryToken(Dog), useValue: dogRepo },
        {
          provide: getDataSourceToken(),
          useValue: { createQueryRunner: jest.fn().mockReturnValue(queryRunner) },
        },
        { provide: AppGateway, useValue: appGateway },
        { provide: TripsGateway, useValue: tripsGateway },
        { provide: MailerService, useValue: mailerService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  // -----------------------------------------------------------------------
  // updateStatus
  // -----------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update the status and save the request', async () => {
      const request = makeTripRequest();
      repo.findOne.mockResolvedValue(request);
      repo.save.mockImplementation(async (r: TripRequest) => r);

      const result = await service.updateStatus('req-1', 'approved');

      expect(result.status).toBe('approved');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    });

    it('should emit a status-updated event via appGateway', async () => {
      const request = makeTripRequest();
      repo.findOne.mockResolvedValue(request);
      repo.save.mockImplementation(async (r: TripRequest) => r);

      await service.updateStatus('req-1', 'rejected');

      expect(appGateway.emitRequestStatusUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-1', status: 'rejected' }),
      );
    });

    it('should throw NotFoundException when request does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent', 'approved')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // approveRequest
  // -----------------------------------------------------------------------
  describe('approveRequest', () => {
    let request: TripRequest;
    let trip: Trip;

    beforeEach(() => {
      request = makeTripRequest();
      trip = makeTrip();
      const createdDogs = request.dogs.map((d) => ({ ...d, trip }));
      const updatedTrip = makeTrip({ dogs: createdDogs as any });

      // queryRunner.manager mocks
      queryRunner.manager.findOne
        .mockResolvedValueOnce(request) // first call: find TripRequest
        .mockResolvedValueOnce(trip);   // second call: find Trip

      queryRunner.manager.create.mockReturnValue(createdDogs);
      queryRunner.manager.save
        .mockResolvedValueOnce(createdDogs) // save dogs
        .mockResolvedValueOnce({ ...request, status: 'approved' }); // save request

      queryRunner.manager.find.mockResolvedValue(createdDogs); // dogs in trip
      queryRunner.manager.update.mockResolvedValue(undefined);
      queryRunner.manager.findOneOrFail.mockResolvedValue(updatedTrip);
    });

    it('should follow the full transaction lifecycle', async () => {
      await service.approveRequest('req-1');

      // Verify transaction flow order
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();

      // rollback should NOT have been called on success
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should save dogs via queryRunner manager', async () => {
      await service.approveRequest('req-1');

      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        Dog,
        expect.arrayContaining([
          expect.objectContaining({ name: 'Buddy', size: 'medium', chipId: 'CHIP001' }),
        ]),
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(Dog, expect.any(Array));
    });

    it('should update trip capacity within the transaction', async () => {
      await service.approveRequest('req-1');

      expect(queryRunner.manager.update).toHaveBeenCalledWith(
        Trip,
        trip.id,
        expect.objectContaining({
          spotsAvailable: expect.any(Number),
          isFull: expect.any(Boolean),
        }),
      );
    });

    it('should mark the request as approved', async () => {
      await service.approveRequest('req-1');

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        TripRequest,
        expect.objectContaining({ status: 'approved' }),
      );
    });

    it('should emit gateway events after commit', async () => {
      await service.approveRequest('req-1');

      expect(appGateway.emitRequestStatusUpdated).toHaveBeenCalled();
      expect(tripsGateway.broadcastTrips).toHaveBeenCalled();
    });

    it('should return the approved request and updated trip', async () => {
      const result = await service.approveRequest('req-1');

      expect(result.request).toEqual(expect.objectContaining({ status: 'approved' }));
      expect(result.trip).toBeDefined();
      expect(result.trip.id).toBe('trip-1');
    });

    it('should rollback and release on error', async () => {
      queryRunner.manager.findOne.mockReset();
      queryRunner.manager.findOne.mockResolvedValueOnce(request);
      queryRunner.manager.findOne.mockResolvedValueOnce(null); // trip not found

      await expect(service.approveRequest('req-1')).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when request is not found', async () => {
      queryRunner.manager.findOne.mockReset();
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(service.approveRequest('req-1')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // reject
  // -----------------------------------------------------------------------
  describe('reject', () => {
    it('should delegate to updateStatus with "rejected"', async () => {
      const request = makeTripRequest();
      repo.findOne.mockResolvedValue(request);
      repo.save.mockImplementation(async (r: TripRequest) => r);

      const result = await service.reject('req-1');

      expect(result.status).toBe('rejected');
    });
  });

  // -----------------------------------------------------------------------
  // deleteRequest
  // -----------------------------------------------------------------------
  describe('deleteRequest', () => {
    it('should throw BadRequestException when deleting a pending request', async () => {
      const pending = makeTripRequest({ status: 'pending' });
      repo.findOne.mockResolvedValue(pending);

      await expect(service.deleteRequest('req-1')).rejects.toThrow(BadRequestException);
      await expect(service.deleteRequest('req-1')).rejects.toThrow(
        'Cannot delete a pending request',
      );
    });

    it('should soft-delete an approved request', async () => {
      const approved = makeTripRequest({ status: 'approved' });
      repo.findOne.mockResolvedValue(approved);
      repo.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteRequest('req-1');

      expect(repo.softDelete).toHaveBeenCalledWith('req-1');
    });

    it('should soft-delete a rejected request', async () => {
      const rejected = makeTripRequest({ status: 'rejected' });
      repo.findOne.mockResolvedValue(rejected);
      repo.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteRequest('req-1');

      expect(repo.softDelete).toHaveBeenCalledWith('req-1');
    });

    it('should throw NotFoundException when request does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.deleteRequest('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
