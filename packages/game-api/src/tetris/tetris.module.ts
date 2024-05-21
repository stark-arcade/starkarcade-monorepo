import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { WsAuthGuard } from '../jwt';
import { TetrisGateway } from './tetris.gateway';
import { TetrisService } from './tetris.service';
import { Web3Service } from '@app/web3/web3.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainSchema, Chains } from '@app/shared/models/schemas';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [WsAuthGuard, TetrisGateway, TetrisService, Web3Service],
})
export class TetrisModule {}
