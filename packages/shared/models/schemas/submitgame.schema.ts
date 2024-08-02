import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { TokenInfoDocument } from './tokeninfo.schema';
import { Document, SchemaTypes } from 'mongoose';

export type SubmitGameDocument = SubmitGames & Document;

export class ExternalLink {
  discord?: string;
  x?: string;
  website?: string;
  warpcastProfile?: string;
}

@Schema({ timestamps: true })
export class SubmitGames extends BaseSchema {
  @Prop()
  email: string;

  @Prop()
  name: string;

  @Prop()
  shortDescription: string;

  @Prop()
  longDescripstion: string;

  @Prop()
  gameUrl: string;

  @Prop()
  sourceUrl: string;

  @Prop()
  logo: string;

  @Prop()
  banner: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'TokenInfos' })
  tokens: TokenInfoDocument[];

  @Prop({ type: ExternalLink })
  externalLink?: ExternalLink;
}

export const SubmitGameSchema = SchemaFactory.createForClass(SubmitGames);
