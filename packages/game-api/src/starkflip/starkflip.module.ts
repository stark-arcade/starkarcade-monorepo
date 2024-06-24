import { ChainSchema, Chains } from '@app/shared/models/schemas';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StarkFlipService } from './starkflip.service';
import { StarkFlipGateWay } from './starkflip.gateway';
import { SettleWorker } from './settleWorker';
import { StarkFlipController } from './starkflip.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [StarkFlipService, StarkFlipGateWay, SettleWorker],
  controllers: [StarkFlipController],
})
export class StarkFlipModule {}
