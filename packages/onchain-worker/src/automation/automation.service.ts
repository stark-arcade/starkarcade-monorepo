import { ChainDocument, Chains } from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import lotteryAbi from '@app/web3/abi/lottery645.json';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  constructor(
    private readonly web3Service: Web3Service,
    @InjectModel(Chains.name) private readonly chainModel: Model<ChainDocument>,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async drawLottery() {
    const chain = await this.chainModel.findOne();
    if (chain) {
      await this.web3Service.invokeContractAsAdmin(
        chain.rpc,
        chain.lotteryContract,
        lotteryAbi,
        'startDrawing',
      );
    } else {
      this.logger.error('Can not find any chain');
    }
  }
}
