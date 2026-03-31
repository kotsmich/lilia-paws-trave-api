import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { TripRequest } from '../requests/trip-request.entity';
import { ContactSubmission } from '../contact/contact.entity';

export const SocketEvent = {
  REQUEST_NEW: 'request.new',
  REQUEST_UPDATED: 'request.updated',
  MESSAGE_NEW: 'message.new',
} as const;

export type SocketEventValue = (typeof SocketEvent)[keyof typeof SocketEvent];

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

  handleConnection(client: WebSocket): void {
    const socket = (client as WebSocket & { _socket?: { remoteAddress?: string } })._socket;
    this.logger.log(`Client connected: ${socket?.remoteAddress ?? 'unknown'}`);
  }

  handleDisconnect(): void {
    this.logger.log('Client disconnected');
  }

  private broadcast<T>(event: SocketEventValue, data: T): void {
    const message = JSON.stringify({ event, data });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /** Emit a new request event to all connected clients. */
  emitNewRequest(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_NEW, request);
  }

  /** Emit a request status update to all connected clients. */
  emitRequestStatusUpdated(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_UPDATED, request);
  }

  /** Emit a new contact message to all connected clients. */
  emitNewMessage(message: ContactSubmission): void {
    this.broadcast(SocketEvent.MESSAGE_NEW, message);
  }
}
