import {
  ChainDocument,
  Chains,
  StarkFlip,
  StarkFlipDocument,
} from '@app/shared/models/schemas';
import { StarkFlipEvents, StarkFlipStatus } from '@app/shared/types';
import { ABIS } from '@app/web3/types';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { RpcProvider, Contract } from 'starknet';
import { SettleParam, SettleWorker } from './settleWorker';
import { num, BigNumberish } from 'starknet';
import { WsException } from '@nestjs/websockets';

export type StarkFlipParam = {
  socket: Socket;
  status: StarkFlipStatus;
  transactionHash: string;
};

@Injectable()
export class StarkFlipService {
  constructor(
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    private readonly settleWorker: SettleWorker,
    @InjectModel(StarkFlip.name)
    private readonly starkflipModel: Model<StarkFlipDocument>,
  ) {}

  private sendGameResult(socket: Socket) {
    socket.emit(StarkFlipEvents.GAME_RESULT, { isWon: null });
  }

  startNewGame(socket: Socket) {
    this.sendGameResult(socket);
  }

  async handleSettle(socket: Socket, transactionHash: string) {
    const chainDocument = await this.chainModel.findOne();
    const provider = new RpcProvider({ nodeUrl: chainDocument.rpc });
    try {
      const txReceipt = await provider.getTransactionReceipt(transactionHash);
      const contract = new Contract(
        ABIS.StarkFlipAbi,
        chainDocument.starkFlipContract,
        provider,
      );

      const parsedEv = contract.parseEvents(txReceipt);

      const gameParam: SettleParam = {
        client: socket,
        gameId: num.toHex(parsedEv[0].CreateGame.id as BigNumberish),
        guess: Number(BigInt(parsedEv[0].CreateGame.guess as BigNumberish)),
        seed: BigInt(parsedEv[0].CreateGame.seed as BigNumberish).toString(),
      };
      this.settleWorker.putGame(gameParam);
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  // Rest API
  async handleGetLeaderboard() {
    const results = await this.starkflipModel
      .aggregate([
        {
          $group: {
            _id: '$player',
            totalFlipped: { $sum: 1 },
            winAmount: {
              $sum: {
                $cond: ['$isWon', { $toDouble: '$stakedAmount' }, 0],
              },
            },
            lostAmount: {
              $sum: {
                $cond: ['$isWon', 0, { $toDouble: '$stakedAmount' }],
              },
            },
            wins: { $sum: { $cond: ['$isWon', 1, 0] } },
            losses: { $sum: { $cond: ['$isWon', 0, 1] } },
          },
        },
        {
          $sort: { winAmount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            player: '$_id',
            totalFlipped: 1,
            winAmount: 1,
            lostAmount: 1,
            wins: 1,
            losses: 1,
            total: { $sum: ['$winAmount', '$lostAmount'] },
          },
        },
        {
          $sort: { winAmount: -1 },
        },
        {
          $project: {
            _id: 0,
            player: 1,
            totalFlipped: 1,
            winAmount: 1,
            wins: 1,
            losses: 1,
            rank: { $literal: 0 },
          },
        },
      ])
      .exec();

    return results.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
