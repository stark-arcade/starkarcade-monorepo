import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { AuthenModule } from './authentication/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRoot(configuration().db_path),
    AuthenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
