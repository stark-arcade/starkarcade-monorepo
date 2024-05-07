import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import {
  GetNonceReqDto,
  GetNonceRspDto,
  GetTokenReqDto,
  GetTokenRspDto,
} from './dto/auth.dto';
import { BaseResult } from '@app/web3/types';
import { UserService } from '../user/user.service';
import { AuthenService } from './auth.service';

@ApiTags('Authentication')
@ApiExtraModels(GetNonceRspDto, BaseResult, GetTokenRspDto)
@Controller('authentication')
export class AuthenController {
  constructor(
    private readonly authService: AuthenService,
    private readonly userService: UserService,
  ) {}

  @Get('/get-nonce')
  @ApiOperation({
    summary: 'Get SignMessage API',
    description: 'Use this API to get the sign message for the user.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(GetNonceRspDto) },
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          properties: {
            error: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async getNonce(
    @Query() query: GetNonceReqDto,
  ): Promise<BaseResult<GetNonceRspDto>> {
    const user = await this.userService.getOrCreateUser(query.address);

    const message = await this.authService.getSignMessage(
      query.address,
      user.nonce,
    );
    return {
      success: true,
      data: {
        nonce: user.nonce,
        signMessage: message,
      },
    };
  }

  @Post('/token')
  @ApiOperation({
    summary: 'Login To Get Access Token API',
    description:
      'After User Sign the message, use this API to get the access token.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(GetTokenRspDto) },
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            errors: {
              example: 'Error Message',
            },
            data: {},
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async connectWallet(
    @Body() tokenDto: GetTokenReqDto,
  ): Promise<BaseResult<GetTokenRspDto>> {
    try {
      const data = await this.authService.login(tokenDto);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
