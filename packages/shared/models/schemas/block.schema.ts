import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Blocks & Document;

export enum BlockWorkerStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

@Schema()
export class Blocks {
  @Prop({ index: true })
  blockNumber: number;

  @Prop({ index: true })
  chain: string;

  @Prop()
  transactions: string[];

  @Prop()
  status: BlockWorkerStatus;

  @Prop()
  timestamp: number;
}

export const BlockSchema = SchemaFactory.createForClass(Blocks);
