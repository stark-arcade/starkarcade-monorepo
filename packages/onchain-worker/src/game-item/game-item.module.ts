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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chains.name, schema: ChainSchema },
      { name: Lotteries.name, schema: LotterySchema },
      { name: Users.name, schema: UserSchema },
      { name: Tickets.name, schema: TicketSchema },
      { name: Blocks.name, schema: BlockSchema },
    ]),
  ],
  providers: [GameItemService, Web3Service, UserService],
  controllers: [GameItemController],
})
export class GameItemModule {}
