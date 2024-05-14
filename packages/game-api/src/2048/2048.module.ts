import { Module } from '@nestjs/common';
import { Game2048Gateway } from './2048.gateway';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChainSchema,
  Chains,
  UserSchema,
  Users,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3/web3.service';
import { Game2048Service } from './2048.service';
import { WsAuthGuard } from '../jwt';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: Users.name, schema: UserSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [
    Game2048Gateway,
    UserService,
    WsAuthGuard,
    Web3Service,
    Game2048Service,
  ],
})
export class Game2048Module {}
