import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { LotteryStatus, PriceMultipliers } from '@app/shared/types';

export type LotteryDocument = Lottery & Document;

@Schema({ timestamps: true })
export class Lottery extends BaseSchema {
  @Prop()
  address: string;

  @Prop({ type: SchemaTypes.String, enum: LotteryStatus })
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

  @Prop({ type: SchemaTypes.Array })
  prizeMultipliers: PriceMultipliers[];

  @Prop({ type: SchemaTypes.Array })
  drawnNumber: number[];
}

export const LotteryDocument = SchemaFactory.createForClass(Lottery);
