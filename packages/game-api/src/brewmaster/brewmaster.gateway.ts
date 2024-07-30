import configuration from '@app/shared/configuration';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BrewMasterService as BrewMasterService } from './brewmaster.service';

@WebSocketGateway(configuration().game_ports.brew_master, {
  cors: {
    origin: '*',
  },
})
export class BrewMasterGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(private readonly BrewMasterService: BrewMasterService) {}

  handleConnection(client: any) {
    console.log(`Client connected to StarkSweep socket: ${client.id}`);
    this.BrewMasterService.handleConnection(client);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected to StarkSweep socket: ${client.id}`);
    this.BrewMasterService.disconnectGame(client);
  }
  afterInit() {
    console.log(`StarkSweep WebSocket Gateway initialized`);
  }

  @SubscribeMessage('spawnCustomer')
  handleUpdate(client: Socket) {
    this.BrewMasterService.handleSpawnCustomer(client);
  }

  @SubscribeMessage('coinCollect')
  handleCoinCollect(client: Socket) {
    this.BrewMasterService.handleCoinCollect(client);
  }

  @SubscribeMessage('claim')
  handleClaim(client: Socket, address: string) {
    this.BrewMasterService.handleClaim(client, address);
  }

  @SubscribeMessage('afterClaim')
  handleAfterClaim(client: Socket) {
    this.BrewMasterService.handleAfterClaim(client);
  }
}
