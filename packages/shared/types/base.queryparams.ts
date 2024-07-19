import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsIn,
  IsOptional,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BaseQueryParams {
  @ApiProperty({ required: false, type: 'number', example: 1 })
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page = 1;

  @ApiProperty({ required: false, type: 'number', example: 10 })
  @Max(100)
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  size = 10;

  @ApiProperty({ required: false, nullable: true })
  @IsAlphanumeric()
  @MaxLength(20)
  @IsOptional()
  orderBy: string;

  @ApiProperty({ required: false, nullable: true, enum: ['desc', 'asc'] })
  @IsOptional()
  @IsIn(['desc', 'asc'])
  desc?: string;

  get skipIndex(): number {
    return this.size * (this.page - 1);
  }
  get sort() {
    const orderBy = this.orderBy ?? 'createdAt';
    const order: any = [[orderBy, this.desc === 'asc' ? 1 : -1]];
    if (orderBy !== 'createdAt') {
      order.push(['createdAt', 1]);
    }
    return order;
  }

  toJSON() {
    return {
      page: this.page,
      size: this.size,
      orderBy: this.orderBy,
      desc: this.desc,
    };
  }
}
