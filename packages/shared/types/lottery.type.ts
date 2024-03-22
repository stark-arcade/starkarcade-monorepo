export enum LotteryStatus {
  OPEN = 'OPEN',
  DRAWING = 'DRAWING',
  CLOSED = 'CLOSED',
}

export type PriceMultipliers = {
  counterMatched: number;
  multiplier: number;
};
