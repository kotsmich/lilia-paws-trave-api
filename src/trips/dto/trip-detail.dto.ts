import { Dog } from '../../dogs/dog.entity';
import { Destination } from '../destination.entity';
import { PickupLocation } from '../pickup-location.entity';

export class RequesterEntry {
  requesterId: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** Set when the requester originated from a formal TripRequest. */
  sourceRequestId: string | null;
  dogs: Dog[];
}

export class TripDetailDto {
  id: string;
  date: string;
  departureCountry: string;
  departureCity: string;
  arrivalCountry: string;
  arrivalCity: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  notes: string;
  totalCapacity: number;
  spotsAvailable: number;
  isFull: boolean;
  acceptingRequests: boolean;
  createdAt: Date;
  updatedAt: Date;
  destinations: Destination[];
  pickupLocations: PickupLocation[];
  dogs: Dog[];
  requesters: RequesterEntry[];
}
