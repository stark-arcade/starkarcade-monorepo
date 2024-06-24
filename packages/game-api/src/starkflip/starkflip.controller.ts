import { Controller } from '@nestjs/common';
import { SettleWorker } from './settleWorker';

@Controller('starkflip')
export class StarkFlipController {
  constructor(private readonly settleWorker: SettleWorker) {
    this.init();
  }

  async init() {
    this.settleWorker.start();
  }
}
