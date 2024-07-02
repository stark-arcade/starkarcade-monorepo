import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document } from 'mongoose';

export type StarkFlipDocument = StarkFlip & Document;

@Schema({ timestamps: true })
export class StarkFlip extends BaseSchema {
  @Prop()
  gameId: string;

  @Prop()
  player: string;

  @Prop()
  guess: number;

  @Prop()
  isWon?: boolean;

  @Prop()
  startedAt: number;

  @Prop()
  settledAt?: number;

  @Prop()
  stakedAmount: string;

  @Prop()
  feeRate: number;
}

export const StarkFlipSchema = SchemaFactory.createForClass(StarkFlip);
StarkFlipSchema.index({ gameId: 1 }, { unique: true });
