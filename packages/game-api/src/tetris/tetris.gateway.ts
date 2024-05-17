import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import configuration from '@app/shared/configuration';
import { TetrisService } from './tetris.service';
import { Direction } from '@app/shared/types';

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
  constructor(private readonly tetrisService: TetrisService) {}

  afterInit() {
    console.log(`Tetris WebSocket Gateway initialized`);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected to Tetris socket: ${client.id}`);
    this.clients.add(client);
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to Tetris socket: ${client.id}`);
    this.tetrisService.disconnectGame(client);
    this.clients.delete(client);
  }

  @SubscribeMessage('startNewGame')
  handleStartGame(client: Socket) {
    this.tetrisService.startNewGame(client);
  }

  @SubscribeMessage('command')
  handleMove(client: Socket, payload: { direction: Direction }) {
    this.tetrisService.command(client, payload.direction);
  }

  @SubscribeMessage('pause')
  handlePause(client: Socket) {
    this.tetrisService.pause(client);
  }

  @SubscribeMessage('resume')
  handleResume(client: Socket) {
    this.tetrisService.resume(client);
  }

  @SubscribeMessage('claimPoint')
  async handleClaimPoint(client: Socket) {
    await this.tetrisService.claimPoint(client);
  }
}
