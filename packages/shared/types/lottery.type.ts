export enum LotteryStatus {
  OPEN = 1,
  DRAWING = 2,
  CLOSED = 0,
}

export type PriceMultipliers = {
  counterMatched: number;
  multiplier: number;
};
