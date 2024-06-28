import { ChainSchema, Chains } from '@app/shared/models/schemas';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StarkSweepGateway } from './starksweep.gateway';
import { StarkSweepService } from './starksweep.service';
import { Web3Service } from '@app/web3/web3.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [StarkSweepGateway, StarkSweepService, Web3Service],
})
export class StarkSweepModule {}
