import { ChainDocument, Chains } from '@app/shared/models/schemas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import {
  distance_between_two_point,
  rotatePointWithRadius,
} from './game/brush';
import { add_two_vectors } from './game/vector';
import { getClaimPointMessage } from '@app/shared/utils';
import { Web3Service } from '@app/web3/web3.service';
import { Account, stark } from 'starknet';
import configuration from '@app/shared/configuration';

export type StarkSweepParam = {
  socket: Socket;
  deltaTime: number;
  mainBrush: { x: string; y: string };
  otherBrush: { x: string; y: string };
  currentTime: number;
  rotateSpeed: number;
  radius: string;
  platformOffset: { x: string; y: string };
  currentPoint: number;
  previousPoint: number;
  level: number; // mỗi level có 5 stage nên mỗi lần thay đổi level là người chơi đã chơi 5 màn
  isCoinCollected: boolean;
  collectedCoin: number;
  direction: number;
};

@Injectable()
export class StarkSweepService {
  constructor(
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    private readonly web3Service: Web3Service,
  ) {}
  private sockets: StarkSweepParam[] = [];

  private change_direction(client: StarkSweepParam) {
    client.direction *= -1;
  }

  private updateCalculate(client: StarkSweepParam) {
    this.rotateBrush(client);
    client.mainBrush = add_two_vectors(
      client.mainBrush.x,
      client.mainBrush.y,
      client.platformOffset.x,
      client.platformOffset.y,
    );
  }

  private rotateBrush(client: StarkSweepParam) {
    let angle = client.deltaTime * client.rotateSpeed;
    client.otherBrush = rotatePointWithRadius(
      client.otherBrush.x,
      client.otherBrush.y,
      client.mainBrush.x,
      client.mainBrush.y,
      angle,
      client.radius,
      client.direction,
    );
  }

  private playerTouch(client: StarkSweepParam) {
    this.change_direction(client);
    let temp = client.mainBrush;
    client.mainBrush = client.otherBrush;
    client.otherBrush = temp;
  }

  private check_true(
    client: StarkSweepParam,
    position: { x: string; y: string },
  ) {
    let distance = distance_between_two_point(
      position.x,
      position.y,
      client.mainBrush.x,
      client.mainBrush.y,
    );
    return distance < parseFloat(client.radius) + 1;
  }

  private async sign_transaction(client: StarkSweepParam, address: string) {
    const chainDocument = await this.chainModel.findOne();
    const time = Math.round(new Date().getTime() / 1e3);
    let typedDataValidate = getClaimPointMessage(
      address,
      client.collectedCoin,
      time,
      chainDocument.name,
    );
    const provider = this.web3Service.getProvider(chainDocument.rpc);
    const signerAccount = new Account(
      provider,
      configuration().signer_wallet.address,
      configuration().signer_wallet.private_key,
    );
    const signature2 = await signerAccount.signMessage(typedDataValidate);
    const proof = stark.formatSignature(signature2);

    return {
      address,
      point: client.collectedCoin,
      timestamp: time,
      proof: proof,
    };
  }

  handleConnection(socket: Socket) {
    this.sockets.push({
      socket,
      deltaTime: 0,
      mainBrush: { x: '0', y: '0' },
      otherBrush: { x: '0', y: '0' },
      currentTime: 0,
      rotateSpeed: 0.2,
      radius: '4',
      platformOffset: { x: '0', y: '0' },
      currentPoint: 0,
      previousPoint: 0,
      level: 0,
      isCoinCollected: true,
      collectedCoin: 0,
      direction: 1,
    });

    setTimeout(() => {
      socket.emit('connection', {
        date: new Date().getTime(),
        data: 'Hello Unity',
      });
    }, 1000);
  }

  disconnectGame(socket: Socket) {
    this.sockets = this.sockets.filter((sk) => sk.socket !== socket);
  }

  handleUpdate(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    client.deltaTime = (new Date().getTime() - client.currentTime) * 0.01;
    this.updateCalculate(client);
    let stringData = JSON.stringify({
      mainBrush: client.mainBrush,
      otherBrush: client.otherBrush,
    });

    client.socket.emit('updateBrushPosition', stringData);
    client.currentTime = new Date().getTime();
  }

  handleSetBrushPosition(
    socket: Socket,
    x1: string,
    y1: string,
    x2: string,
    y2: string,
  ) {
    const client = this.sockets.find((i) => i.socket == socket);

    client.mainBrush = { x: x1, y: y1 };
    client.otherBrush = { x: x2, y: y2 };
  }

  handlePlayerTouch(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    this.playerTouch(client);
  }

  handleUpdatePlatformPosition(
    socket: Socket,
    positionX: string,
    positionY: string,
  ) {
    const client = this.sockets.find((i) => i.socket == socket);

    client.platformOffset = { x: positionX, y: positionY };
  }

  handleUpdateLevel(socket: Socket, level: number) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (level == 0) {
      client.level = level;
    }
    if (level != client.level) {
      client.level = level;
      client.isCoinCollected = false;
    }
    client.socket.emit('spawnCoin', (!client.isCoinCollected).toString());
  }

  handleCoinCollect(socket: Socket, positionX: string, positionY: string) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (
      client.isCoinCollected == false &&
      this.check_true(client, { x: positionX, y: positionY })
    ) {
      client.isCoinCollected = true;
      client.collectedCoin++;
      client.socket.emit('updateCoin', client.collectedCoin.toString());
    }
    client.socket.emit('spawnCoin', (!client.isCoinCollected).toString());
  }

  async handleClaim(socket: Socket, address: string) {
    const client = this.sockets.find((i) => i.socket == socket);

    const proof = await this.sign_transaction(client, address);
    client.socket.emit('updateProof', JSON.stringify(proof));
  }
}
