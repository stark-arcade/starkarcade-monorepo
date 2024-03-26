import { Controller } from '@nestjs/common';
import { GameItemService } from './game-item.service';
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

@Controller('game-item')
export class GameItemController {
  constructor(
    @InjectModel(Chains.name) private readonly chainModel: Model<ChainDocument>,
    @InjectModel(Blocks.name) private readonly blockModel: Model<BlockDocument>,
    private readonly gameService: GameItemService,
    private readonly web3Service: Web3Service,
  ) {
    if (!this.listeners) this.init();
  }
  listeners: BlockDetectService[];

  async init() {
    const chains = await this.chainModel.find();
    this.listeners = chains
      .filter((chain) => chain.lotteryContract)
      .map(
        (chain) =>
          new BlockDetectService(
            this.blockModel,
            this.web3Service,
            chain,
            this.gameService,
          ),
      );

    for (const job of this.listeners) {
      job.start();
    }
  }
}
