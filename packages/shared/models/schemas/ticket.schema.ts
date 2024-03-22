import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { LotteryDocument } from './lottery.schema';
import { UserDocument } from './user.schema';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class Tickets extends BaseSchema {
  @Prop()
  ticketId: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Lotteries' })
  lottery: LotteryDocument;

  @Prop({ type: SchemaTypes.Array })
  pickedNumbers: number[];

  @Prop()
  amount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  bougthTime: number;

  @Prop()
  counterRightNumbers?: number;

  @Prop()
  payout?: number;
}

export const TicketSchema = SchemaFactory.createForClass(Tickets);
