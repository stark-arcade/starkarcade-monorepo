import { Schema } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { LotteryDocument } from './lottery.schema';
import { UserDocument } from './user.schema';

@Schema({ timestamps: true })
export class Ticket extends BaseSchema {
  ticketId: number;
  lottery: LotteryDocument;
  pickedNumbers: number[];
  amount: number;
  user: UserDocument;
  bougthTime: number;
  counterRightNumbers?: number;
  payout?: number;
}
