// guards/only-empty-users.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ClientsService } from "../clients/clients.service";
import { InstancesService } from "../instances/instances.service";

@Injectable()
export class FuxAuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly clientsService: ClientsService,
    private readonly instancesService: InstancesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userCount = await this.usersService.count();
    const clientsCount = await this.clientsService.count();
    const instancesCount = await this.instancesService.count();
    if (userCount > 0 || clientsCount > 0 || instancesCount > 0) {
      throw new ForbiddenException(
        "Install route is disabled: users already exist.",
      );
    }
    return true;
  }
}
