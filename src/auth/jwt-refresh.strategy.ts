import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { User } from "../users/user.model";
import { UsersService } from "../users/users.service";

const cookieExtractor = (req: Request & { cookies: any }) => {
  return req?.cookies?.refreshToken;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") as string,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request & { cookies: any },
    payload: { sub: string; user: Partial<User>; permissions: any[] },
  ) {
    const refreshToken =
      cookieExtractor(req) || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    const cacheKey = `refreshToken:${refreshToken}`;
    const tokenExists = await this.cacheManager.get(cacheKey);
    if (!tokenExists || tokenExists !== payload.sub.toString()) {
      throw new UnauthorizedException("Unvalid Token");
    }
    await this.cacheManager.del(cacheKey);
    return await this.usersService.findById(payload.user.id);
  }
}
