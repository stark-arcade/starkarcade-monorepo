import { Controller, Get, Query } from '@nestjs/common';
import { SettleWorker } from './settleWorker';
import { StarkFlipService } from './starkflip.service';
import { StarkFlipQuery } from './dto/starkFlipQuery';
import { JWT } from '../jwt';

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

  @Get('/recentGames')
  async getRecentGames() {
    const data = await this.starkFlipService.handleGetRentWinner();
    return data;
  }

  @JWT()
  @Get('/history')
  async getHistory(@Query() query: StarkFlipQuery) {
    const data = await this.starkFlipService.handleGetHistory(query);
    return data;
  }
}
