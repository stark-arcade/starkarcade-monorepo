import { Schema } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class BaseSchema {
  _id?: string;

  createdAt?: string;

  updatedAt?: string;
}
