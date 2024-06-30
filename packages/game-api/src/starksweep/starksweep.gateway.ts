import configuration from '@app/shared/configuration';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { StarkSweepService } from './starksweep.service';

@WebSocketGateway(configuration().game_ports.stark_sweep, {
  cors: {
    origin: '*',
  },
})
export class StarkSweepGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(private readonly starkSweepService: StarkSweepService) {}

  handleConnection(client: any) {
    console.log(`Client connected to StarkSweep socket: ${client.id}`);
    this.starkSweepService.handleConnection(client);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected to StarkSweep socket: ${client.id}`);
    this.starkSweepService.disconnectGame(client);
  }
  afterInit() {
    console.log(`StarkSweep WebSocket Gateway initialized`);
  }

  @SubscribeMessage('update')
  handleUpdate(client: Socket) {
    this.starkSweepService.handleUpdate(client);
  }

  @SubscribeMessage('setBrushPosition')
  handleSetBrushPosition(client: Socket, data: any) {
    // console.log("Set Brush position x1: " + x1 + " y1: " + y1 + " x2: " + x2 + " y2: " + y2);
    this.starkSweepService.handleSetBrushPosition(
      client,
      data[0],
      data[1],
      data[2],
      data[3],
    );
  }

  @SubscribeMessage('playerTouch')
  handlePlayerTouch(client: Socket) {
    this.starkSweepService.handlePlayerTouch(client);
  }

  @SubscribeMessage('updatePlatformPosition')
  handleUpdatePlatformPosition(client: Socket, data: any) {
    this.starkSweepService.handleUpdatePlatformPosition(
      client,
      data[0],
      data[1],
    );
  }

  @SubscribeMessage('updateLevel')
  handleUpdateLevel(client: Socket, level: number) {
    this.starkSweepService.handleUpdateLevel(client, level);
  }

  @SubscribeMessage('coinCollect')
  handleCoinCollect(client: Socket, data: any) {
    this.starkSweepService.handleCoinCollect(client, data[0], data[1]);
  }

  @SubscribeMessage('claim')
  handleClaim(client: Socket, address: string) {
    console.log('claim: ' + address);
    this.starkSweepService.handleClaim(client, address);
  }

  @SubscribeMessage('afterClaim')
  handleAfterClaim(client: Socket) {
    this.starkSweepService.handleAfterClaim(client);
  }
}
