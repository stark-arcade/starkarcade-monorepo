import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document } from 'mongoose';

export type ChainDocument = Chains & Document;

@Schema({ timestamps: true })
export class Chains extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  rpc: string;

  @Prop()
  delayBlock: number;

  @Prop()
  explore: string;

  @Prop()
  lotteryContract: string;

  @Prop()
  governanceContract: string;

  @Prop()
  randomnessContract: string;

  @Prop()
  ticketContract: string;
}

export const ChainSchema = SchemaFactory.createForClass(Chains);
