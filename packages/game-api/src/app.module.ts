import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { AuthenModule } from './authentication/auth.module';
import { UserModule } from './user/user.module';
import { Game2048Module } from './2048/2048.module';
import { TetrisModule } from './tetris/tetris.module';
import { StarkFlipModule } from './starkflip/starkflip.module';
import { StarkSweepModule } from './starksweep/starksweep.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRoot(configuration().db_path),
    UserModule,
    AuthenModule,
    Game2048Module,
    TetrisModule,
    // StarkFlipModule,
    StarkSweepModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
