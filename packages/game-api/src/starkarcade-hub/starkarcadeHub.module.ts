import { Module } from '@nestjs/common';
import { StarkArcadeHubService } from './starkarcadeHub.service';
import { StarkArcadeHubController } from './starkarcadeHub.controller';
import { MailingService } from '../mailing/mailing.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChainSchema,
  Chains,
  SubmitGameSchema,
  SubmitGames,
  TokenInfoSchema,
  TokenInfos,
} from '@app/shared/models/schemas';
import { TokenInfoService } from '../tokeninfo/tokeninfo.service';
import { Web3Service } from '@app/web3/web3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubmitGames.name, schema: SubmitGameSchema },
      { name: TokenInfos.name, schema: TokenInfoSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [
    StarkArcadeHubService,
    MailingService,
    TokenInfoService,
    Web3Service,
  ],
  controllers: [StarkArcadeHubController],
})
export class StarkArcadeHubModule {}
