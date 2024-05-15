import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import configuration from '@app/shared/configuration';

@UseGuards(WsAuthGuard)
@WebSocketGateway(configuration().game_ports.game_tetris, {
  cors: {
    origin: '*',
  },
})
export class TetrisGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private clients: Set<Socket> = new Set();

  afterInit() {
    console.log(`Tetris WebSocket Gateway initialized`);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected to Tetris socket: ${client.id}`);
    this.clients.add(client);
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to Tetris socket: ${client.id}`);
    this.clients.delete(client);
  }
}
