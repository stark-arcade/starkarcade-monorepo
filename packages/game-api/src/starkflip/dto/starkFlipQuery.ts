import { BaseQueryParams } from '@app/shared/types/base.queryparams';

import { ApiProperty } from '@nestjs/swagger';

export class StarkFlipQuery extends BaseQueryParams {
  @ApiProperty({
    required: true,
    type: 'string',
    example:
      '0x061674c04154f27175b1fc4e9a0cbfea0649c36cb8f28264e30b13bb672e2ddc',
  })
  address: string;
}
