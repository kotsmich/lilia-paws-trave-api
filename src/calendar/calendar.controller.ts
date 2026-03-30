import { Controller, Get } from '@nestjs/common';
import { TripsService } from '../trips/trips.service';

/** Event colors must stay in sync with the Angular calendar selector */
const TRIP_COLOR_IN_PROGRESS = '#e07b54';
const TRIP_COLOR_UPCOMING = '#4caf50';
const TRIP_COLOR_UNAVAILABLE = '#94a3b8';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async getEvents(): Promise<Array<{ id: string; tripId: string; title: string; date: string; color: string }>> {
    const trips = await this.tripsService.findAll();
    return trips
      .filter((t) => t.status !== 'completed')
      .map((t) => ({
        id: `evt-${t.id}`,
        tripId: t.id,
        title: `${t.departureCity} → ${t.arrivalCity}`,
        date: t.date,
        color:
          t.isFull || t.spotsAvailable <= 0 || !t.acceptingRequests
            ? TRIP_COLOR_UNAVAILABLE
            : t.status === 'in-progress'
              ? TRIP_COLOR_IN_PROGRESS
              : TRIP_COLOR_UPCOMING,
      }));
  }
}
