import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { PermissionsGuard } from "src/auth/permission.guard";
import { FILTER_BY_ACCESS_KEY, FilterConfig } from "src/decorators/filter-by-access.decorator";
import { ResourceType } from "src/decorators/permissions.decorator";

@Injectable()
export class AccessFilterInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const config = this.reflector.get<FilterConfig>(
      FILTER_BY_ACCESS_KEY,
      context.getHandler()
    );

    config.clientParam = config.clientParam || "client";
    config.instanceParam = config.instanceParam || "instance";

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se è super admin, non filtrare
    if (user.isSuperAdmin) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => this.filterByAccess(data, user, config))
    );
  }

  private async filterByAccess(data: any, user: any, config: FilterConfig) {

    if (Array.isArray(data)) {
      const dataFilter = await Promise.all(data.map(item => this.hasAccessToItem(item, user, config)));
      return data.filter((i,idx) => dataFilter[idx]);
    }
    
    return await this.hasAccessToItem(data, user, config) ? data : null;
  }

  private async hasAccessToItem(item: any, user, config: FilterConfig): Promise<boolean> {
    const i = item[config.instanceParam!] || item.get(config.instanceParam);
    const c = item[config.clientParam!] || item.get(config.clientParam);

    if(i == null && c == null) {
      return false;
    }

    if(i != null) {
        return await PermissionsGuard.checkAccess(user,
        ResourceType.INSTANCE,
        [config],
        c,
        i);
    } else {
        return await PermissionsGuard.checkAccess(user,
        ResourceType.CLIENT,
        [config],
        c);
    }
  }
}