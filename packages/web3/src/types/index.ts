export type LotteryDetail = {
  id: number;
  minimumPrice: number;
  state: number;
  drawTime: number;
  drawnNumbers: number[];
  amountOfTickets: number;
  totalValue: number;
  jackpot: number;
  jackpotWinners: number;
};

export enum EventType {
  StartNewLottery = 'StartNewLottery',
  DrawnNumbers = 'DrawnNumbers',
  WithdrawWinning = 'WithdrawWinning',
  TicketCreated = 'TicketCreated',
}
export type LogsReturnValues = {
  returnValues: any;
  eventType: EventType;
};
