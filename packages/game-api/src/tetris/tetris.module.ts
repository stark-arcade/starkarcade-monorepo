import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { WsAuthGuard } from '../jwt';
import { TetrisGateway } from './tetris.gateway';
import { TetrisService } from './tetris.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [WsAuthGuard, TetrisGateway, TetrisService],
})
export class TetrisModule {}
