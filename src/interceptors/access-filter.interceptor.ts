import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { PermissionsGuard } from "src/auth/permission.guard";
import {
  FILTER_BY_ACCESS_KEY,
  FilterConfig,
} from "src/decorators/filter-by-access.decorator";
import { ResourceType } from "src/decorators/permissions.decorator";
import { User } from "src/users/user.model";
import { Request } from "express";

@Injectable()
export class AccessFilterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const config = this.reflector.get<FilterConfig>(
      FILTER_BY_ACCESS_KEY,
      context.getHandler(),
    );

    config.clientParam = config.clientParam || "client";
    config.instanceParam = config.instanceParam || "instance";

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as {
      sub: string;
      user: Partial<User>;
      permissions: unknown[];
    };

    // Se è super admin, non filtrare
    if (user.user.isSuperAdmin) {
      return next.handle();
    }

    return next
      .handle()
      .pipe(map((data) => this.filterByAccess(data, user, config)));
  }

  private async filterByAccess(
    data: unknown,
    user: unknown,
    config: FilterConfig,
  ): Promise<unknown> {
    if (Array.isArray(data)) {
      const dataFilter = await Promise.all(
        data.map((item) =>
          this.hasAccessToItem(
            item as Record<string, unknown> & {
              get?: (key: string) => unknown;
            },
            user,
            config,
          ),
        ),
      );
      return data.filter((i, idx) => dataFilter[idx]);
    }

    return (await this.hasAccessToItem(
      data as Record<string, unknown> & { get?: (key: string) => unknown },
      user,
      config,
    ))
      ? data
      : null;
  }

  private async hasAccessToItem(
    item: Record<string, unknown> & { get?: (key: string) => unknown },
    user: unknown,
    config: FilterConfig,
  ): Promise<boolean> {
    const i = item[config.instanceParam!] || item.get?.(config.instanceParam!);
    const c = item[config.clientParam!] || item.get?.(config.clientParam!);

    if (i == null && c == null) {
      return false;
    }

    if (i != null) {
      return await PermissionsGuard.checkAccess(
        user as Parameters<typeof PermissionsGuard.checkAccess>[0],
        ResourceType.INSTANCE,
        [config],
        c as number,
        i as number,
      );
    } else {
      return await PermissionsGuard.checkAccess(
        user as Parameters<typeof PermissionsGuard.checkAccess>[0],
        ResourceType.CLIENT,
        [config],
        c as number,
      );
    }
  }
}
