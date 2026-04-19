import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Trip } from './trip.entity';
import { Destination } from './destination.entity';
import { PickupLocation } from './pickup-location.entity';
import { TripRequest } from '../requests/trip-request.entity';
import { TripsGateway } from './trips.gateway';
import { AppGateway } from '../gateway/app.gateway';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripDetailDto, RequesterEntry } from './dto/trip-detail.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string | undefined): v is string => !!v && UUID_RE.test(v);

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip) private repo: Repository<Trip>,
    @InjectRepository(TripRequest) private requestRepo: Repository<TripRequest>,
    @InjectRepository(Destination) private destinationRepo: Repository<Destination>,
    @InjectRepository(PickupLocation) private pickupLocationRepo: Repository<PickupLocation>,
    @Inject(forwardRef(() => TripsGateway))
    private readonly tripsGateway: TripsGateway,
    private readonly appGateway: AppGateway,
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
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
    dto.destinations = trip.destinations ?? [];
    dto.pickupLocations = trip.pickupLocations ?? [];
    dto.dogs = trip.dogs;
    dto.requesters = entries;

    return dto;
  }

  private static readonly defaultDestinationNames = [
    'Αθήνα, Ελλάδα', 'Θεσσαλονίκη, Ελλάδα', 'Βερολίνο, Γερμανία',
    'Μόναχο, Γερμανία', 'Αμβούργο, Γερμανία', 'Παρίσι, Γαλλία',
    'Άμστερνταμ, Ολλανδία', 'Ρώμη, Ιταλία', 'Βαρκελώνη, Ισπανία',
    'Βιέννη, Αυστρία', 'Βρυξέλλες, Βέλγιο', 'Ζυρίχη, Ελβετία',
  ];

  private static readonly defaultPickupLocationNames = [
    'Αθήνα, Ελλάδα', 'Θεσσαλονίκη, Ελλάδα', 'Λάρισα, Ελλάδα',
    'Βόλος, Ελλάδα', 'Ιωάννινα, Ελλάδα',
  ];

  /** Create a new trip from validated DTO data. */
  async create(data: CreateTripDto): Promise<Trip> {
    const destNames = data.destinations?.length
      ? data.destinations.map((d) => d.name)
      : TripsService.defaultDestinationNames;
    const pickNames = data.pickupLocations?.length
      ? data.pickupLocations.map((p) => p.name)
      : TripsService.defaultPickupLocationNames;
    const destinations = destNames.map((name) => this.destinationRepo.create({ name }));
    const pickupLocations = pickNames.map((name) => this.pickupLocationRepo.create({ name }));
    const trip = this.repo.create({
      ...data,
      destinations,
      pickupLocations,
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
    if (data.destinations !== undefined) {
      const newIds = new Set(data.destinations.filter((d) => isUuid(d.id)).map((d) => d.id!));
      const toDelete = (trip.destinations ?? []).filter((d) => !newIds.has(d.id));
      if (toDelete.length) await this.destinationRepo.remove(toDelete);
      trip.destinations = data.destinations.map((d) =>
        this.destinationRepo.create({ id: isUuid(d.id) ? d.id : undefined, name: d.name }),
      );
    }
    if (data.pickupLocations !== undefined) {
      const newIds = new Set(data.pickupLocations.filter((p) => isUuid(p.id)).map((p) => p.id!));
      const toDelete = (trip.pickupLocations ?? []).filter((p) => !newIds.has(p.id));
      if (toDelete.length) await this.pickupLocationRepo.remove(toDelete);
      trip.pickupLocations = data.pickupLocations.map((p) =>
        this.pickupLocationRepo.create({ id: isUuid(p.id) ? p.id : undefined, name: p.name }),
      );
    }

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

  /** Remove a trip by ID, cancel all pending requests with email notification, and broadcast the update. */
  async remove(id: string): Promise<void> {
    const trip = await this.findOne(id);

    const pendingRequests = await this.requestRepo.find({
      where: { tripId: id, status: 'pending' },
      relations: ['trip'],
    });

    const tripRoute = `${trip.departureCity} → ${trip.arrivalCity}`;
    const businessEmail = this.config.get<string>('MAIL_USER', 'liliapawstravel@gmail.com');
    const unsubscribeEmail = this.config.get<string>('UNSUBSCRIBE_EMAIL', 'unsubscribe@liliapawstravel.com');

    for (const req of pendingRequests) {
      req.status = 'cancelled';
      const saved = await this.requestRepo.save(req);
      this.appGateway.emitRequestStatusUpdated(saved);
      this.logger.log(`Request ${req.id} auto-cancelled due to trip ${id} deletion`);

      if (req.requesterEmail) {
        try {
          await this.mailerService.sendMail({
            to: req.requesterEmail,
            subject: 'Your trip request has been cancelled — Lilia Paws Travel',
            replyTo: businessEmail,
            template: 'trip-cancelled',
            context: {
              requesterName: req.requesterName,
              tripRoute,
              tripDate: trip.date,
            },
            text: [
              `Hi ${req.requesterName},`,
              ``,
              `We regret to inform you that the trip ${tripRoute} on ${trip.date} has been cancelled.`,
              `As a result, your request has been cancelled as well.`,
              ``,
              `If you have any questions or would like to arrange an alternative, please contact us directly and we will be happy to help.`,
              ``,
              `— Lilia Paws Travel`,
              `liliapawstravel.com`,
            ].join('\n'),
            headers: { 'List-Unsubscribe': `<mailto:${unsubscribeEmail}>` },
          });
        } catch (err) {
          this.logger.error(`Failed to send cancellation email to ${req.requesterEmail}`, err);
        }
      }
    }

    await this.repo.remove(trip);
    await this.tripsGateway.broadcastTrips();
  }
}
