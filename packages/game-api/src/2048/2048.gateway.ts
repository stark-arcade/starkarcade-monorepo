import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../jwt/ws-auth.guard';
import { Game2048Service } from './2048.service';
import configuration from '@app/shared/configuration';

@UseGuards(WsAuthGuard)
@WebSocketGateway(configuration().game_ports.game_2048, {
  cors: {
    origin: '*',
  },
})
export class Game2048Gateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly gameService: Game2048Service) {}
  private clients: Set<Socket> = new Set();
  @WebSocketServer() server: Server;

  afterInit() {
    console.log(`WebSocket Gateway initialized`);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.add(client);
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.gameService.disconnectGame(client);
    this.clients.delete(client);
  }

  @SubscribeMessage('startNewGame')
  handleStartGame(client: Socket, payload: any) {
    const userAddress = (client.handshake as any).user.sub;

    console.log(
      `Message from client ${userAddress}: ${JSON.stringify(payload)}`,
    );
    this.gameService.startNewGame(client, Number(payload));
  }

  @SubscribeMessage('command')
  handleMove(client: Socket, payload: any) {
    this.gameService.onCommand(client, payload);
  }

  @SubscribeMessage('cancelGame')
  handleCancelGame(client: Socket) {
    this.gameService.closeGame(client);
  }

  @SubscribeMessage('claimPoint')
  async handleClaimPoint(client: Socket) {
    const userAddress = (client.handshake as any).user.sub;
    await this.gameService.claimPoint(client, userAddress);
  }
}
