import { ChainSchema, Chains } from '@app/shared/models/schemas';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrewMasterGateway } from './brewmaster.gateway';
import { BrewMasterService } from './brewmaster.service';
import { Web3Service } from '@app/web3/web3.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [BrewMasterGateway, BrewMasterService, Web3Service],
})
export class BrewMasterModule {}
