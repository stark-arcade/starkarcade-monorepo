export * from './base.result';

import { SuccessfulTransactionReceiptResponse } from 'starknet';
import ticketAbi from '../abi/ticket.json';
import lotteryAbi from '../abi/lottery645.json';
import accountAbi from '../abi/account.json';

export enum EventTopic {
  TICKET_CREATED = '0x2013b4817f658d5d62bc494cf84c1dfa1150756dcf9783d0fc31d8133795c6d',
  LOTTERY_STARTED = '0x1b009627a191bdefc95afc44ac77f4d4f9d6a4209e8b4461dfbe11530bb1222',
  DRAWN_NUMBERS = '0x1d9ef9b22b4d2736713032ee746f4f355e05f1b2258bbcfb4489de3f14c67b',
  WITHDRAW_WINNING = '',
}

export type LotteryOnchainDetail = {
  id: number;
  minimumPrice: number;
  state: number;
  startTime: number;
  drawTime: number;
  drawnNumbers: bigint[];
  amountOfTickets: number;
  totalValue: number;
  jackpot: number;
  jackpotWinners: number;
};

export type TicketOnchainDetail = {
  ticketId: number;
  lotteryAddress: string;
  lotteryId: number;
  pickedNumbers: number[];
  payOut: number;
  user: string;
  sameCombinationCounter: number;
};

export enum EventType {
  StartNewLottery = 'StartNewLottery',
  DrawnNumbers = 'DrawnNumbers',
  WithdrawWinning = 'WithdrawWinning',
  TicketCreated = 'TicketCreated',
}
export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
};

export const ABIS = {
  TicketABI: ticketAbi,
  LotteryABI: lotteryAbi,
  AccountABI: accountAbi,
};
