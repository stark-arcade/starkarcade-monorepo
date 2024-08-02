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
import { BrewMasterModule } from './brewmaster/brewmaster.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailingModule } from './mailing/mailing.module';
import { StarkArcadeHubModule } from './starkarcade-hub/starkarcadeHub.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRoot(configuration().db_path),
    MailerModule.forRoot({
      transport: `smtps://${process.env.EMAIL}:${process.env.PASS}@smtp.gmail.com/`,
      template: {
        dir: process.cwd() + '/templates/',
        adapter: new HandlebarsAdapter(), // or new PugAdapter()
        options: {
          strict: true,
        },
      },
    }),
    UserModule,
    AuthenModule,
    Game2048Module,
    TetrisModule,
    StarkFlipModule,
    StarkSweepModule,
    BrewMasterModule,
    MailingModule,
    StarkArcadeHubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
