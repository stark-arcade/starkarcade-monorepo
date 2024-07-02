import { ONCHAIN_JOBS, ONCHAIN_QUEUES } from '@app/shared/types';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Process, Processor } from '@nestjs/bull';
import { GameItemService } from '../../game-item.service';
import { ChainDocument, Chains } from '@app/shared/models/schemas';
import { Model } from 'mongoose';
import { Queue, Job } from 'bull';
import { LogsReturnValues } from '@app/web3/types';
import { Logger } from '@nestjs/common';
import { retryUntil } from '@app/shared/utils';

@Processor(ONCHAIN_QUEUES.QUEUE_SETTLE_GAME)
export class SettleGameProcessor {
  constructor(
    private readonly gameService: GameItemService,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_SETTLE_GAME)
    private readonly queue: Queue<LogsReturnValues>,
  ) {}

  logger = new Logger(SettleGameProcessor.name);

  @Process({ name: ONCHAIN_JOBS.JOB_SETTLE_GAME, concurrency: 100 })
  async detectCreateGame(job: Job<LogsReturnValues>) {
    const event = job.data;
    const maxRetry = 10;
    const chain = await this.chainModel.findOne();
    try {
      await retryUntil(
        async () => await this.gameService.processEvent(event, chain),
        () => true,
        maxRetry,
      );
    } catch (error) {
      this.logger.error(`Failed to detect tx hash ${event.transaction_hash}`);
      this.queue.add(ONCHAIN_JOBS.JOB_SETTLE_GAME, event);
    }
  }
}
