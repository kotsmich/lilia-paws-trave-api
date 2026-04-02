import { Dog } from '../../dogs/dog.entity';

export class RequesterEntry {
  /** The originating request ID, or null for manually added dogs */
  requestId: string | null;
  name: string;
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
  dogs: Dog[];
  /** Requesters grouped by name, each with their associated dogs */
  requester: RequesterEntry[];
}
