import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutomationModule } from './automation/automation.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { Web3Module } from '@app/web3/web3.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GameItemModule } from './game-item/game-item.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    MongooseModule.forRoot(configuration().db_path),
    Web3Module,
    AutomationModule,
    GameItemModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('QUEUE_HOST'),
          port: config.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
