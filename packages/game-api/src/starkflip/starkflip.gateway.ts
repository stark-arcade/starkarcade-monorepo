import configuration from '@app/shared/configuration';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { StarkFlipService } from './starkflip.service';

@WebSocketGateway(configuration().game_ports.stark_flip, {
  cors: {
    origin: '*',
  },
})
export class StarkFlipGateWay
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(private readonly starkFlipService: StarkFlipService) {}

  afterInit(server: Socket) {
    console.log(`StarkFlip WebSocket Gateway initialized`);
  }

  private clients: Set<Socket> = new Set();
  handleConnection(client: Socket) {
    console.log(`Client connected to StarkFlip socket: ${client.id}`);
    this.clients.add(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to StarkFlip socket: ${client.id}`);
    this.clients.delete(client);
  }

  @SubscribeMessage('startNewGame')
  startNewGame(client: Socket) {
    this.starkFlipService.startNewGame(client);
  }

  @SubscribeMessage('handleStettle')
  async handleStettle(client: Socket, payload: { transactionHash: string }) {
    await this.starkFlipService.handleSettle(client, payload.transactionHash);
  }
}
