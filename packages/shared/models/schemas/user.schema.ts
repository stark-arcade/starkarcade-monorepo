import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';

export type UserDocument = Users & Document;

@Schema({ timestamps: true })
export class Users extends BaseSchema {
  @Prop({ unique: true })
  username: string;

  @Prop()
  address: string;

  @Prop()
  nonce: number;

  @Prop()
  email?: string;

  @Prop()
  avatar?: string;

  @Prop()
  cover?: string;

  @Prop()
  about?: string;

  @Prop({ default: false })
  emailVerified?: boolean;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop()
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(Users);
