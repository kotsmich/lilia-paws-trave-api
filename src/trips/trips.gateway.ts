import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { TripsService } from './trips.service';

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
    client.send(JSON.stringify({ event: 'trips', data: trips }));
  }

  async broadcastTrips(): Promise<void> {
    const trips = await this.tripsService.findAll();
    const message = JSON.stringify({ event: 'trips', data: trips });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
