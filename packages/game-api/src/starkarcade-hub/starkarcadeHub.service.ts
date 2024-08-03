import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SubmitGameBodyDto } from './dto/starkarcade.dto';
import { TokenInfoService } from '../tokeninfo/tokeninfo.service';
import {
  SubmitGameDocument,
  SubmitGames,
  TokenInfoDocument,
} from '@app/shared/models/schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailingService } from '../mailing/mailing.service';

@Injectable()
export class StarkArcadeHubService {
  constructor(
    @InjectModel(SubmitGames.name)
    private readonly submitGameModel: Model<SubmitGameDocument>,
    private readonly tokenInfoService: TokenInfoService,
    private readonly mailingService: MailingService,
  ) {}

  async submitGame(body: SubmitGameBodyDto) {
    const {
      email,
      name,
      shortDescription,
      longDescription,
      gameUrl,
      sourceUrl,
      logo,
      banner,
      tokens,
      totalSupply,
    } = body;

    const tokenInfos: TokenInfoDocument[] = [];
    for (const token of tokens) {
      const tokenInfo = await this.tokenInfoService.getOrCreate(token);
      if (!tokenInfo) {
        throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
      }
      tokenInfos.push(tokenInfo);
    }

    const newSubmitGame: SubmitGames = {
      email: email.trim(),
      name: name.trim(),
      shortDescription,
      longDescription,
      gameUrl: gameUrl.trim(),
      sourceUrl: sourceUrl.trim(),
      logo,
      banner,
      tokens: tokenInfos,
      totalSupply,
    };
    try {
      await this.submitGameModel.create(newSubmitGame);
      await this.mailingService.sendMail(email);
      return newSubmitGame;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
