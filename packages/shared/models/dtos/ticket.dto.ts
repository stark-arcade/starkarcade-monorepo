import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsNumber,
} from 'class-validator';
import { ObjectId } from 'mongoose';

export class TicketDTO {
  @IsNumber()
  ticketId: number;

  @IsMongoId()
  lottery: ObjectId;

  @IsArray()
  @ArrayMaxSize(6)
  @ArrayMinSize(6)
  @ArrayUnique()
  pickedNumbers: number[];

  user: ObjectId;

  @IsNumber()
  bougthTime: number;

  @IsNumber()
  counterRightNumbers?: number;

  @IsNumber()
  payout?: number;
}
