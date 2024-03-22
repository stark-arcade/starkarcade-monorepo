import { LotteryStatus, PriceMultipliers } from '@app/shared/types';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsHexadecimal,
  IsNumber,
  Length,
} from 'class-validator';

export class LotteryDTO {
  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => String(value).toLowerCase())
  address: string;

  @IsEnum(LotteryStatus)
  status: LotteryStatus;

  @IsNumber()
  lotteryId: number;

  @IsNumber()
  ticketPrice: number;

  @IsNumber()
  startTime: number;

  @IsNumber()
  drawTime: number;

  @IsNumber()
  totalValue: number;

  @IsNumber()
  jackpot: number;

  @IsArray()
  prizeMultipliers: PriceMultipliers[];

  @IsArray()
  drawnNumber: number[];
}
