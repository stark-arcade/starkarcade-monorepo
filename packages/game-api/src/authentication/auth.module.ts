import { UserSchema, Users } from '@app/shared/models/schemas';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import configuration from '@app/shared/configuration';
import { AuthenService } from './auth.service';
import { UserService } from '../user/user.service';
import { Web3Service } from '@app/web3/web3.service';
import { AuthenController } from './auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: configuration().jwt.secret,
        signOptions: {
          expiresIn: configuration().jwt.expire,
        },
      }),
    }),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  controllers: [AuthenController],
  providers: [AuthenService, UserService, Web3Service],
})
export class AuthenModule {}
