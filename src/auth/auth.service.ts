import { Inject, Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "src/users/user.model";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { InstancesService } from "../instances/instances.service";
import { PermissionsService } from "../permissions/permissions.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private instanceService: InstancesService,
    private permissionService: PermissionsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    const payloadRefresh = {
      sub: user.id.toString() as string,
      user: { ...user.toJSON() } as Partial<User>,
    };
    delete payloadRefresh.user.password;
    const instances = await this.instanceService.findAll();

    const permissionsP = instances.map((instance) => {
      return this.permissionService.findUserPermissions(
        user.id,
        instance.client,
        instance.id,
      );
    });

    const permissions = await Promise.all(permissionsP);

    const resPermission = permissions
      .map((permission, idx) => {
        if (permission.length > 0) {
          return {
            instance: instances[idx].id,
            permissions: permission.map((p) => p.get("name")),
          };
        } else {
          return null;
        }
      })
      .filter((p) => p !== null);

    const payloadAccess = { ...payloadRefresh, permissions: resPermission };
    const res = {
      user: {
        username: user.get("username"),
        id: user.id,
        email: user.get("email"),
      },
      accessToken: await this.jwtService.signAsync(payloadAccess, {
        expiresIn: "15m",
      }),
      refreshToken: await this.jwtService.signAsync(payloadRefresh, {
        expiresIn: "7d",
      }),
    };

    const cacheKey = `refreshToken:${res.refreshToken}`;
    const refreshTokenTTL = 7 * 24 * 60 * 60;
    await this.cacheManager.set(cacheKey, user.id, refreshTokenTTL);
    return res;
  }
}
