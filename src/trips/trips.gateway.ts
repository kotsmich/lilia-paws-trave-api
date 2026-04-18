import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { TripsService } from './trips.service';
import { Trip, TripDestination } from './trip.entity';

/** Public availability projection — never includes dogs, requests, or PII. */
interface TripAvailability {
  id: string;
  date: string;
  departureCountry: string;
  departureCity: string;
  arrivalCountry: string;
  arrivalCity: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  totalCapacity: number;
  spotsAvailable: number;
  isFull: boolean;
  acceptingRequests: boolean;
  destinations: TripDestination[];
  pickupLocations: TripDestination[];
}

function toAvailability(trip: Trip): TripAvailability {
  return {
    id: trip.id,
    date: trip.date,
    departureCountry: trip.departureCountry,
    departureCity: trip.departureCity,
    arrivalCountry: trip.arrivalCountry,
    arrivalCity: trip.arrivalCity,
    status: trip.status,
    totalCapacity: trip.totalCapacity,
    spotsAvailable: trip.spotsAvailable,
    isFull: trip.isFull,
    acceptingRequests: trip.acceptingRequests,
    destinations: trip.destinations ?? [],
    pickupLocations: trip.pickupLocations ?? [],
  };
}

@WebSocketGateway({
  path: '/ws/trips',
  cors: {
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'https://liliapawstravel.com',
    ],
  },
})
export class TripsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
  ) {}

  async handleConnection(client: WebSocket): Promise<void> {
    const trips = await this.tripsService.findAll();
    client.send(JSON.stringify({ event: 'trips', data: trips.map(toAvailability) }));
  }

  async broadcastTrips(): Promise<void> {
    const trips = await this.tripsService.findAll();
    const message = JSON.stringify({ event: 'trips', data: trips.map(toAvailability) });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
