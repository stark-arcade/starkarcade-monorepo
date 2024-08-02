import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document, SchemaTypes } from 'mongoose';
import { ChainDocument } from './chain.schema';

export type TokenInfoDocument = TokenInfos & Document;

@Schema({ timestamps: true })
export class TokenInfos extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chains' })
  chain: ChainDocument;

  @Prop()
  decimals: number;

  @Prop()
  contractAddress: string;

  @Prop()
  enabled: boolean;

  @Prop()
  isNative: boolean; // ETH and STRK
}

export const TokenInfoSchema = SchemaFactory.createForClass(TokenInfos);
TokenInfoSchema.index({ contractAddress: 1 }, { unique: true });
