import {
  ChainDocument,
  Lotteries,
  LotteryDocument,
  TicketDocument,
  Tickets,
} from '@app/shared/models/schemas';
import { formattedContractAddress } from '@app/shared/utils';
import { TicketCreatedReturnValue } from '@app/web3/decode';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { Web3Service } from '@app/web3/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { num } from 'starknet';
import { UserService } from '../users/user.service';
import { plainToInstance } from 'class-transformer';
import { TicketDTO } from '@app/shared/models/dtos';

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

    const newLotteryDocument = await this.web3Service.getLotteryDetail(
      lotteryAddress,
      lotteryId,
      chain,
    );
    const lotteryInserted = await this.lotteryModel.create(newLotteryDocument);
    return lotteryInserted;
  }

  async processTicketCreated(log: LogsReturnValues, chain: ChainDocument) {
    const {
      ticketId: ticketIdBigInt,
      user: userBigInt,
      lotteryAddress: lotteryAddressBigInt,
      lotteryId: lotteryIdBigInt,
      pickedNumbers: pickedNumbersBigInt,
      boughtTime: boughtTimeBigInt,
    } = log.returnValues as TicketCreatedReturnValue;

    const ticketId = Number(ticketIdBigInt.toString());
    const userAddress = num.toHexString(userBigInt);
    const lotteryAddress = formattedContractAddress(
      num.toHexString(lotteryAddressBigInt),
    );
    const lotteryId = Number(lotteryIdBigInt.toString());
    const pickedNumbers = pickedNumbersBigInt.map((value) =>
      Number(value.toString()),
    );
    const boughtTime = Number(boughtTimeBigInt.toString()) * 1e3;

    this.logger.debug(
      `New ticket was created by ${userAddress} with ticket id - ${ticketId} at ${new Date(boughtTime)}`,
    );

    const lottery = await this.getOrCreateNewLottery(
      lotteryAddress,
      lotteryId,
      chain,
    );

    const user = await this.userService.getOrCreateUser(userAddress);
    const newTicket: Tickets = {
      ticketId,
      lottery,
      pickedNumbers,
      user,
      boughtTime,
      counterRightNumbers: 0,
      payout: 0,
    };

    await this.ticketModel.findOneAndUpdate(
      { ticketId },
      { $set: plainToInstance(TicketDTO, newTicket) },
      { new: true, upsert: true },
    );
  }
}
