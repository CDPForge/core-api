// src/common/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  AccessRequirement,
  PERMISSIONS_KEY,
  ResourceType,
} from "../decorators/permissions.decorator";
import { IS_SUPER_ADMIN_KEY } from "../decorators/is-super-admin.decorator";

import { Instance } from "src/instances/entities/instance.entity";
import { Model } from "sequelize-typescript";
import { ModelStatic } from "sequelize";
import { Request } from "express";
import { User as UserModel } from "../users/user.model";

type AuthenticatedUser = {
  sub: string | number;
  user: Partial<UserModel>;
  permissions: {
    client?: number;
    instance?: number;
    permissions: { permission: string; level: number }[];
  }[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    // Controlla se l'endpoint richiede l'accesso da super-admin
    const isSuperAdminRequired = this.reflector.getAllAndOverride<boolean>(
      IS_SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se l'utente è un super-admin, salta tutti i controlli
    if (user && user.user.isSuperAdmin) {
      return true;
    }

    // Se l'accesso da super-admin era richiesto e l'utente non lo è, nega l'accesso
    if (isSuperAdminRequired) {
      throw new ForbiddenException(
        "You must be a Super Admin to access this resource.",
      );
    }

    const requirement = this.reflector.get<AccessRequirement>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requirement || requirement.resourceType === ResourceType.NONE) {
      return true;
    }

    const resourceId = await this.extractParam(
      request,
      requirement.resourceIdParam || "id",
    );

    const clientId = parseInt(
      (await this.extractParam(
        request,
        requirement.clientIdParam || "client",
        requirement.resource,
        resourceId,
      )) as string,
    );

    const instanceId = parseInt(
      (await this.extractParam(
        request,
        requirement.instanceIdParam || "instance",
        requirement.resource,
        resourceId,
      )) as string,
    );

    // Verifica i permessi
    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    return PermissionsGuard.checkAccess(
      user,
      requirement.resourceType,
      requirement.permissions,
      clientId,
      instanceId,
    );
  }

  /**
   * Estrae un parametro da URL params, query params o body
   */
  private async extractParam(
    request: Request,
    paramName: string,
    Resource?: ModelStatic<Model>,
    resourceId?: unknown,
  ): Promise<unknown> {
    if (Resource != null) {
      const res = await Resource.findByPk(resourceId as string | number);
      if (!res) return undefined;
      return res.get(paramName);
    }

    const params = request.params as Record<string, unknown> | undefined;
    const query = request.query as Record<string, unknown> | undefined;
    const body = request.body as Record<string, unknown> | undefined;

    // 1. Prova nei parametri URL (es: /clients/:clientId)
    if (params && params[paramName]) {
      return params[paramName];
    }

    // 2. Prova nei query parameters (es: ?clientId=123)
    if (query && query[paramName]) {
      return query[paramName];
    }

    // 3. Prova nel body (per POST/PUT/PATCH)
    if (body && body[paramName]) {
      return body[paramName];
    }

    return undefined;
  }

  public static async checkAccess(
    user: AuthenticatedUser,
    resourceType: ResourceType,
    requiredPermissions: { permission: string; level: string }[],
    clientId?: number,
    instanceId?: number,
  ): Promise<boolean> {
    if (user.user.isSuperAdmin) return true;

    if (resourceType == ResourceType.INSTANCE && !instanceId)
      resourceType = ResourceType.CLIENT;

    switch (resourceType) {
      case ResourceType.INSTANCE:
        if (!instanceId)
          throw new ForbiddenException("Instance ID is required");
        return this.hasInstanceAccess(
          user.permissions,
          instanceId,
          requiredPermissions,
        );

      case ResourceType.CLIENT:
        if (!clientId) throw new ForbiddenException("Client ID is required");
        return this.hasClientAccess(
          user.permissions,
          clientId,
          requiredPermissions,
        );

      default:
        return true;
    }
  }

  private static async hasInstanceAccess(
    permissions: {
      client?: number;
      instance?: number;
      permissions: { permission: string; level: number }[];
    }[],
    instanceId: number,
    requiredPermissions: { permission: string; level: string }[],
  ): Promise<boolean> {
    const instance = await Instance.findByPk(instanceId);
    if (!instance) {
      throw new ForbiddenException("Instance not found");
    }
    const clientId = instance.get("client");

    const hasInstancePermissions = requiredPermissions.every((rp) => {
      return permissions.some((p) => {
        return (
          p.instance === instanceId &&
          p.permissions.some((ip) => {
            return (
              ip.permission === rp.permission &&
              this.checkLevel(ip.level, rp.level)
            );
          })
        );
      });
    });

    return (
      hasInstancePermissions ||
      this.hasClientAccess(permissions, clientId, requiredPermissions)
    );
  }

  private static hasClientAccess(
    permissions: {
      client?: number;
      instance?: number;
      permissions: { permission: string; level: number }[];
    }[],
    clientId: number,
    requiredPermissions: { permission: string; level: string }[],
  ): boolean {
    return requiredPermissions.every((rp) => {
      return permissions.some((p) => {
        return (
          p.client === clientId &&
          p.instance == null &&
          p.permissions.some((ip) => {
            return (
              ip.permission === rp.permission &&
              this.checkLevel(ip.level, rp.level)
            );
          })
        );
      });
    });
  }

  private static checkLevel(level: number, requiredLevel: string): boolean {
    switch (requiredLevel) {
      case "READ":
        return [7, 6, 5, 4].includes(level);
      case "WRITE":
        return [7, 6].includes(level);
      case "EXECUTE":
        return [7, 5].includes(level);
      default:
        return false;
    }
  }
}
