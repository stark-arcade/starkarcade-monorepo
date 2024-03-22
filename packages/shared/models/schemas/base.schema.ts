import { Prop, Schema } from '@nestjs/mongoose';
import { Date, ObjectId, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: ObjectId;

  @Prop({ type: SchemaTypes.Date })
  createdAt: Date;

  @Prop({ type: SchemaTypes.Date })
  updatedAt: Date;
}
