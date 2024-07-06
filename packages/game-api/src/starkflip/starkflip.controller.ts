import { Controller, Get } from '@nestjs/common';
import { SettleWorker } from './settleWorker';
import { StarkFlipService } from './starkflip.service';

@Controller('starkflip')
export class StarkFlipController {
  constructor(
    private readonly settleWorker: SettleWorker,
    private readonly starkFlipService: StarkFlipService,
  ) {
    this.init();
  }

  async init() {
    this.settleWorker.start();
  }
  @Get('/leaderboard')
  async getLeaderboard() {
    const data = await this.starkFlipService.handleGetLeaderboard();
    return data;
  }
}
