import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { LotteryDocument } from './lottery.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';

export type TicketDocument = Tickets & Document;

@Schema({ timestamps: true })
export class Tickets extends BaseSchema {
  @Prop()
  ticketId: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Lotteries' })
  lottery: LotteryDocument;

  @Prop({ type: SchemaTypes.Array })
  pickedNumbers: number[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  boughtTime: number;

  @Prop()
  txHash: string;

  @Prop()
  counterRightNumbers?: number;

  @Prop()
  payout?: number;
}

export const TicketSchema = SchemaFactory.createForClass(Tickets);
