import {
  ChainDocument,
  Lotteries,
  LotteryDocument,
  TicketDocument,
  Tickets,
} from '@app/shared/models/schemas';
import { TicketCreatedReturnValue } from '@app/web3/decode';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { Web3Service } from '@app/web3/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../users/user.service';

@Injectable()
export class GameItemService {
  constructor(
    @InjectModel(Tickets.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Lotteries.name)
    private readonly lotteryModel: Model<LotteryDocument>,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
  ) {}

  logger = new Logger(GameItemService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};
    process[EventType.TicketCreated] = this.processTicketCreated;
    await process[log.eventType].call(this, log, chain);
  }

  async getOrCreateNewLottery(
    lotteryAddress: string,
    lotteryId: number,
    chain: ChainDocument,
  ): Promise<LotteryDocument> {
    const lotteryDocument = await this.lotteryModel.findOne({
      address: lotteryAddress,
      lotteryId,
    });

    if (lotteryDocument) {
      return lotteryDocument;
    }

    const newLottery = await this.web3Service.getLotteryDetail(
      lotteryAddress,
      lotteryId,
      chain,
    );
    const lotteryInserted = await this.lotteryModel.create(newLottery);
    return lotteryInserted;
  }

  async processTicketCreated(log: LogsReturnValues, chain: ChainDocument) {
    const {
      ticketId,
      user,
      lotteryAddress,
      lotteryId,
      pickedNumbers,
      boughtTime,
    } = log.returnValues as TicketCreatedReturnValue;

    this.logger.debug(
      `New ticket was created by ${user} with ticket id - ${ticketId} at ${new Date(boughtTime)}`,
    );

    const lottery = await this.getOrCreateNewLottery(
      lotteryAddress,
      lotteryId,
      chain,
    );

    const userDocument = await this.userService.getOrCreateUser(user);
    const newTicket: Tickets = {
      ticketId,
      lottery,
      pickedNumbers,
      user: userDocument,
      boughtTime,
      txHash: log.transaction_hash,
      counterRightNumbers: 0,
      payout: 0,
    };

    await this.ticketModel.findOneAndUpdate(
      { ticketId, counterRightNumbers: { $ne: 0 } },
      { $set: newTicket },
      { new: true, upsert: true },
    );
  }
}
