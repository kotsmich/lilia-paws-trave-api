import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
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
    origin: ['http://localhost:4200', 'http://localhost:4201', 'https://liliapawstravel.com'],
  },
})
@Injectable()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: WebSocket): void {
    console.log(`[AppGateway] Client connected: ${(client as any)._socket?.remoteAddress ?? 'unknown'}`);
  }

  handleDisconnect(): void {
    console.log('[AppGateway] Client disconnected');
  }

  private broadcast<T>(event: SocketEventValue, data: T): void {
    const message = JSON.stringify({ event, data });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  emitNewRequest(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_NEW, request);
  }

  emitRequestStatusUpdated(request: TripRequest): void {
    this.broadcast(SocketEvent.REQUEST_UPDATED, request);
  }

  emitNewMessage(message: ContactSubmission): void {
    this.broadcast(SocketEvent.MESSAGE_NEW, message);
  }
}
