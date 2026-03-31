export class PublicTripDto {
  id: string;
  date: string;
  departureCountry: string;
  departureCity: string;
  arrivalCountry: string;
  arrivalCity: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  totalCapacity: number;
  spotsAvailable: number;
  acceptingRequests: boolean;
  isFull: boolean;

  static from(trip: {
    id: string;
    date: string;
    departureCountry: string;
    departureCity: string;
    arrivalCountry: string;
    arrivalCity: string;
    status: 'upcoming' | 'in-progress' | 'completed';
    totalCapacity: number;
    spotsAvailable: number;
    acceptingRequests: boolean;
    isFull: boolean;
  }): PublicTripDto {
    const dto = new PublicTripDto();
    dto.id = trip.id;
    dto.date = trip.date;
    dto.departureCountry = trip.departureCountry;
    dto.departureCity = trip.departureCity;
    dto.arrivalCountry = trip.arrivalCountry;
    dto.arrivalCity = trip.arrivalCity;
    dto.status = trip.status;
    dto.totalCapacity = trip.totalCapacity;
    dto.spotsAvailable = trip.spotsAvailable;
    dto.acceptingRequests = trip.acceptingRequests;
    dto.isFull = trip.isFull;
    return dto;
  }
}
