import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { WsAuthGuard } from '../jwt';
import { TetrisGateway } from './tetris.gateway';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [WsAuthGuard, TetrisGateway],
})
export class TetrisModule {}
