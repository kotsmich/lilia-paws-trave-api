import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import { TripRequest } from '../requests/trip-request.entity';
import { ContactSubmission } from '../contact/contact.entity';

export const SocketEvent = {
  REQUEST_NEW: 'request.new',
  REQUEST_UPDATED: 'request.updated',
  MESSAGE_NEW: 'message.new',
} as const;

export type SocketEventValue = (typeof SocketEvent)[keyof typeof SocketEvent];

type AdminClient = WebSocket & { isAdmin?: boolean };

function parseCookie(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.trim().split('=');
    if (key) acc[key.trim()] = decodeURIComponent(rest.join('=').trim());
    return acc;
  }, {});
}

@WebSocketGateway({
  path: '/ws/app',
  cors: {
    origin: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:4200,http://localhost:4201')
      .split(',')
      .map((o: string) => o.trim()),
  },
})
@Injectable()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: AdminClient, req: IncomingMessage): void {
    try {
      const cookie = req.headers.cookie ?? '';
      const token = parseCookie(cookie)['admin_token'];
      this.jwtService.verify(token);
      client.isAdmin = true;
      this.logger.log('Admin client connected');
    } catch {
      client.terminate();
    }
  }

  handleDisconnect(): void {
    this.logger.log('Client disconnected');
  }

  private broadcast<T>(event: SocketEventValue, data: T): void {
    const message = JSON.stringify({ event, data });
    this.server.clients.forEach((c) => {
      const client = c as AdminClient;
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(message);
      }
    });
  }

  /** Emit a new request event to all connected admin clients. */
  emitNewRequest(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_NEW, request);
  }

  /** Emit a request status update to all connected admin clients. */
  emitRequestStatusUpdated(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_UPDATED, request);
  }

  /** Emit a new contact message to all connected admin clients. */
  emitNewMessage(message: ContactSubmission): void {
    this.broadcast(SocketEvent.MESSAGE_NEW, message);
  }
}
