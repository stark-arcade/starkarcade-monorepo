import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { UserDocument, Users } from '@app/shared/models/schemas';
import configuration from '@app/shared/configuration';
import { JwtPayload } from '../authentication/dto/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
    // private readonly jwtService: RequestContext,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration().jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { sub } = payload;
    const user = await this.userModel.findOne({ address: sub }).exec();
    if (!user) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
