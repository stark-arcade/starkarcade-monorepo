import {
  ChainSchema,
  Chains,
  Lotteries,
  LotterySchema,
  StarkFlip,
  StarkFlipSchema,
  TicketSchema,
  Tickets,
  UserSchema,
  Users,
} from '@app/shared/models/schemas';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MQ_JOB_DEFAULT_CONFIG, ONCHAIN_QUEUES } from '@app/shared/types';
import { Web3Service } from '@app/web3/web3.service';
import { GameItemService } from '../game-item.service';
import { UserService } from '../users/user.service';
import { SettleGameProcessor } from './processors/settleGame.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StarkFlip.name, schema: StarkFlipSchema },
      { name: Tickets.name, schema: TicketSchema },
      { name: Lotteries.name, schema: LotterySchema },
      { name: Users.name, schema: UserSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
    BullModule.registerQueue({
      name: ONCHAIN_QUEUES.QUEUE_SETTLE_GAME,
      defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
    }),
  ],
  providers: [Web3Service, GameItemService, UserService, SettleGameProcessor],
})
export class SettleGameQueueModule {}
