import { Controller, Get } from '@nestjs/common';
import { TripsService } from '../trips/trips.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async getEvents() {
    const trips = await this.tripsService.findAll();
    return trips
      .filter((t) => t.status !== 'completed')
      .map((t) => ({
        id: `evt-${t.id}`,
        tripId: t.id,
        title: `${t.departureCity} → ${t.arrivalCity}`,
        date: t.date,
        color: t.status === 'in-progress' ? '#e07b54' : '#4caf50',
      }));
  }
}
