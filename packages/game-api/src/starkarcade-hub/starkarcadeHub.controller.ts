import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmitGameBodyDto } from './dto/starkarcade.dto';
import { BaseResult } from '@app/web3/types';
import { StarkArcadeHubService } from './starkarcadeHub.service';

@Controller('starkarcade-hub')
@ApiTags('StarkArcade Hub')
export class StarkArcadeHubController {
  constructor(private readonly hubService: StarkArcadeHubService) {}

  @Post('submit-game')
  @ApiOperation({
    summary: 'Submit game detail to hub.',
  })
  async submitGame(
    @Body() body: SubmitGameBodyDto,
  ): Promise<BaseResult<string>> {
    await this.hubService.submitGame(body);
    return new BaseResult('Submit game successful.');
  }
}
