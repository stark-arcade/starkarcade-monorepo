import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document } from 'mongoose';
import { LotteryStatus, PriceMultipliers } from '@app/shared/types';

export type LotteryDocument = Lotteries & Document;

@Schema({ timestamps: true })
export class Lotteries extends BaseSchema {
  @Prop()
  address: string;

  @Prop({ enum: LotteryStatus })
  status: LotteryStatus;

  @Prop()
  lotteryId: number;

  @Prop()
  ticketPrice: number;

  @Prop()
  startTime: number;

  @Prop()
  drawTime: number;

  @Prop()
  totalValue: number;

  @Prop()
  jackpot: number;

  @Prop()
  prizeMultipliers: PriceMultipliers[];

  @Prop()
  drawnNumber: number[];
}

export const LotterySchema = SchemaFactory.createForClass(Lotteries);
