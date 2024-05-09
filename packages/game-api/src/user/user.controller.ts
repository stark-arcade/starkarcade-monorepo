import { Controller, Get, HttpCode, Req } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { iInfoToken } from '../authentication/dto/auth.dto';
import { JWT, User } from '../jwt';
import { BaseResult } from '@app/web3/types';
import { UserDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('user')
@ApiExtraModels(UserDto, BaseResult)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @JWT()
  @Get('/info')
  @ApiOperation({
    summary: 'Get User Profile',
    description: 'Use this API to get the profile of user using access token.',
  })
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', $ref: getSchemaPath(UserDto) },
          },
        },
      ],
    },
  })
  async getUserInfo(
    @Req() req: Request,
    @User() user: iInfoToken,
  ): Promise<BaseResult<UserDto>> {
    const data = await this.userService.getUser(user.sub);

    return new BaseResult<UserDto>(data);
  }
}
