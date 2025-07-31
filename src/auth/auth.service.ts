import {Inject, Injectable} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "src/users/user.model";
import {CACHE_MANAGER, Cache} from "@nestjs/cache-manager";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user =
      (await this.usersService.findOne(username)) ||
      (await this.usersService.findByEmail(username));

    if (user && (await bcrypt.compare(pass, user.get("password")))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id.toString() };
    const res = {
      user: {
        username: user.get("username"),
        id: user.id,
        email: user.get("email"),
      },
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: "15m",
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: "7d",
      }),
    };

    const cacheKey = `refreshToken:${res.refreshToken}`;
    const refreshTokenTTL = 7 * 24 * 60 * 60;
    await this.cacheManager.set(cacheKey, user.id, refreshTokenTTL);
    return res;
  }
}
