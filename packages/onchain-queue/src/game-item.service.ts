import {
  ChainDocument,
  Lotteries,
  LotteryDocument,
  StarkFlip,
  StarkFlipDocument,
  TicketDocument,
  Tickets,
} from '@app/shared/models/schemas';
import {
  CreateGameReturnValue,
  DrawnNumbersReturnValue,
  NewLotteryStartReturnValue,
  SettleGameReturnValue,
  TicketCreatedReturnValue,
  WithdrawWinningReturnValue,
} from '@app/web3/decode';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { Web3Service } from '@app/web3/web3.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FEE_PRECISION, LotteryStatus } from '@app/shared/types';
import { initPricerMultiplier } from '@app/web3/constant';
import { UserService } from './users/user.service';
import { delay } from '@app/shared/utils';

@Injectable()
export class GameItemService {
  constructor(
    @InjectModel(Tickets.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Lotteries.name)
    private readonly lotteryModel: Model<LotteryDocument>,
    @InjectModel(StarkFlip.name)
    private readonly starkFlipModel: Model<StarkFlipDocument>,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
  ) {}

  logger = new Logger(GameItemService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};
    process[EventType.TicketCreated] = this.processTicketCreated;
    process[EventType.StartNewLottery] = this.processNewLotteryCreated;
    process[EventType.DrawnNumbers] = this.processDrawnNumbers;
    process[EventType.WithdrawWinning] = this.processWithdrawWinning;
    process[EventType.CreateGame] = this.processCreateStarkFlipGame;
    process[EventType.SettleGame] = this.processSettleStarkFlipGame;

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

  async getOrCreateTicket(
    ticketId: number,
    chain: ChainDocument,
  ): Promise<TicketDocument> {
    const ticketDocument = await this.ticketModel.findOne({ ticketId });

    if (ticketDocument) {
      return ticketDocument;
    }

    const ticketOnchainDetail = await this.web3Service.getTicketOnchainDetail(
      ticketId,
      chain,
    );
    const user = await this.userService.getOrCreateUser(
      ticketOnchainDetail.user,
    );

    const lottery = await this.getOrCreateNewLottery(
      ticketOnchainDetail.lotteryAddress,
      ticketOnchainDetail.lotteryId,
      chain,
    );

    const ticketEntity: Tickets = {
      ticketId: ticketOnchainDetail.ticketId,
      lottery,
      pickedNumbers: ticketOnchainDetail.pickedNumbers,
      user,
      boughtTime: 0,
      txHash: '',
      counterRightNumbers: ticketOnchainDetail.sameCombinationCounter,
      payout: ticketOnchainDetail.payOut,
    };

    const newTicket = await this.ticketModel.create(ticketEntity);
    return newTicket;
  }

  async processCreateStarkFlipGame(
    log: LogsReturnValues,
    chain: ChainDocument,
  ) {
    const { gameId, player, stakedAmount, guess, feeRate, startedAt } =
      log.returnValues as CreateGameReturnValue;

    this.logger.debug(
      `New StarkFlip was created by ${player} with game id - ${gameId} at ${new Date(startedAt)}`,
    );

    const newGame: StarkFlip = {
      gameId,
      player,
      guess,
      startedAt,
      stakedAmount,
      feeRate,
    };

    await this.starkFlipModel.findOneAndUpdate(
      { gameId },
      { $set: newGame },
      { upsert: true },
    );
  }

  async processSettleStarkFlipGame(
    log: LogsReturnValues,
    chain: ChainDocument,
  ) {
    const { gameId, player, stakedAmount, isWon, settledAt } =
      log.returnValues as SettleGameReturnValue;

    this.logger.debug(
      `Settle StarkFlip with game id - ${gameId} at ${new Date(settledAt)}`,
    );

    let isFinish = false;
    while (!isFinish) {
      const game = await this.starkFlipModel.findOne({ gameId });
      if (!game) {
        await delay(1);
      } else {
        game.isWon = isWon;
        game.settledAt = settledAt;
        game.reward = isWon
          ? (
              Number(game.stakedAmount) -
              (Number(game.stakedAmount) * game.feeRate) / FEE_PRECISION
            ).toString()
          : '0';

        await game.save();
        isFinish = true;
      }
    }
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

  async processNewLotteryCreated(log: LogsReturnValues, chain: ChainDocument) {
    const { id, startTime, drawTime, jackpot } =
      log.returnValues as NewLotteryStartReturnValue;

    this.logger.debug(`New lottery was created by with id - ${id}`);

    const newLottery: Lotteries = {
      chain,
      address: chain.lotteryContract,
      status: LotteryStatus.OPEN,
      lotteryId: id,
      ticketPrice: 1,
      startTime,
      drawTime,
      jackpot,
      prizeMultipliers: initPricerMultiplier,
      drawnNumber: [],
    };

    await this.lotteryModel.findOneAndUpdate(
      {
        lotteryId: id,
        chain,
        $and: [
          { status: { $ne: LotteryStatus.DRAWING } },
          { status: { $ne: LotteryStatus.CLOSED } },
        ],
      },
      { $set: newLottery },
      { upsert: true },
    );
  }

  async processDrawnNumbers(log: LogsReturnValues, chain: ChainDocument) {
    const { lotteryId, drawnNumber } =
      log.returnValues as DrawnNumbersReturnValue;

    const lotteryDocument = await this.lotteryModel.findOne({
      lotteryId,
      address: chain.lotteryContract,
    });

    if (lotteryDocument && lotteryDocument.status === LotteryStatus.OPEN) {
      await this.lotteryModel.findOneAndUpdate(
        { _id: lotteryDocument._id },
        { $set: { status: LotteryStatus.CLOSED, drawnNumber } },
      );
    } else if (!lotteryDocument) {
      await this.getOrCreateNewLottery(chain.lotteryContract, lotteryId, chain);
    }

    const winningTickets = await this.ticketModel.aggregate([
      {
        $match: {
          pickedNumbers: { $elemMatch: { $in: drawnNumber } },
        },
      },
      {
        $addFields: {
          counterRightNumbers: {
            $size: {
              $setIntersection: ['$pickedNumbers', drawnNumber],
            },
          },
        },
      },
      {
        $match: {
          counterRightNumbers: { $gte: 2 },
        },
      },
    ]);

    if (winningTickets.length > 0) {
      const updateTicket = [];
      for (const ticket of winningTickets) {
        updateTicket.push({
          updateOne: {
            filter: { _id: ticket._id },
            update: { counterRightNumbers: ticket.counterRightNumbers },
          },
        });
      }
      await this.ticketModel.bulkWrite(updateTicket);
    }
  }

  async processWithdrawWinning(log: LogsReturnValues, chain: ChainDocument) {
    const { ticketId, payout } = log.returnValues as WithdrawWinningReturnValue;

    const ticketDocument = await this.getOrCreateTicket(ticketId, chain);
    if (ticketDocument.payout == 0) {
      await this.ticketModel.findOneAndUpdate(
        { _id: ticketDocument._id },
        { $set: { payout } },
      );
    }
  }
}
