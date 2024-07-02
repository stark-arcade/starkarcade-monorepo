import { Module } from '@nestjs/common';
import { GameItemController } from './game-item.controller';
import { GameItemService } from './game-item.service';
import { Web3Service } from '@app/web3/web3.service';
import { UserService } from '../users/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Blocks,
  BlockSchema,
  ChainSchema,
  Chains,
  Lotteries,
  LotterySchema,
  TicketSchema,
  Tickets,
  UserSchema,
  Users,
} from '@app/shared/models/schemas';
import { BullModule } from '@nestjs/bull';
import { MQ_JOB_DEFAULT_CONFIG, ONCHAIN_QUEUES } from '@app/shared/types';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chains.name, schema: ChainSchema },
      { name: Lotteries.name, schema: LotterySchema },
      { name: Users.name, schema: UserSchema },
      { name: Tickets.name, schema: TicketSchema },
      { name: Blocks.name, schema: BlockSchema },
    ]),
    BullModule.registerQueue(
      {
        name: ONCHAIN_QUEUES.QUEUE_CREATE_GAME,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_SETTLE_GAME,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  providers: [GameItemService, Web3Service, UserService],
  controllers: [GameItemController],
})
export class GameItemModule {}
