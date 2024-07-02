import { Controller } from '@nestjs/common';
import { BlockDetectService } from './block-detect.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blocks,
  BlockDocument,
  ChainDocument,
  Chains,
} from '@app/shared/models/schemas';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3/web3.service';
import { InjectQueue } from '@nestjs/bull';
import { ONCHAIN_QUEUES } from '@app/shared/types';
import { Queue } from 'bull';
import { LogsReturnValues } from '@app/web3/types';
import { OnchainQueueService } from './queue/onchainQueue';

@Controller('game-item')
export class GameItemController {
  constructor(
    @InjectModel(Chains.name) private readonly chainModel: Model<ChainDocument>,
    @InjectModel(Blocks.name) private readonly blockModel: Model<BlockDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_CREATE_GAME)
    private readonly createGameQueue: Queue<LogsReturnValues>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_SETTLE_GAME)
    private readonly settelGameQueue: Queue<LogsReturnValues>,
    private readonly web3Service: Web3Service,
    private readonly onchainQueueService: OnchainQueueService,
  ) {
    if (!this.listeners) this.init();
  }
  listeners: BlockDetectService[];

  async init() {
    const chains = await this.chainModel.find();
    this.listeners = chains
      .filter((chain) => chain.rpc)
      .map(
        (chain) =>
          new BlockDetectService(
            this.createGameQueue,
            this.settelGameQueue,
            this.onchainQueueService,
            this.blockModel,
            this.web3Service,
            chain,
          ),
      );

    for (const job of this.listeners) {
      job.start();
    }
  }
}
