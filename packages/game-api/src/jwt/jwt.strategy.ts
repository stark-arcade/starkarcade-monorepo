import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import configuration from '@app/shared/configuration';
import { JwtPayload } from '../authentication/dto/auth.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
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
    const user = await this.userService.getUser(sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    payload.role = user.roles;
    return payload;
  }
}
