import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request & { cookies: any }) => {
          return req?.cookies?.refreshToken || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") as string,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request & { cookies: any },
    payload: { sub: string; username: string },
  ) {
    const refreshToken = req?.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    const cacheKey = `refreshToken:${refreshToken}`;
    const tokenExists = await this.cacheManager.get(cacheKey);
    if (!tokenExists || tokenExists !== payload.sub.toString()) {
      throw new UnauthorizedException("Unvalid Token");
    }
    await this.cacheManager.del(cacheKey);
    return { userId: payload.sub, username: payload.username };
  }
}
