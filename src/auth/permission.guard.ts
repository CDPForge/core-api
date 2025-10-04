// src/common/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessRequirement, PERMISSIONS_KEY, ResourceType } from "../decorators/permissions.decorator";
import { IS_SUPER_ADMIN_KEY } from "../decorators/is-super-admin.decorator";
import { User } from "../users/user.model";
import { Instance } from "src/instances/entities/instance.entity";
import { Model } from "sequelize-typescript";
import { ModelStatic } from "sequelize";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: {
      sub: string;
      user: Partial<User>;
      permissions: { client: number, instance?: number; permissions: {permission: string, level: number}[] }[];
    } = request.user;

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
      context.getHandler()
    );

    if (!requirement || requirement.resourceType === ResourceType.NONE) {
      return true;
    }

    const resourceId = await this.extractParam(
      request,
      requirement.resourceIdParam || 'id'
    );

    const clientId = parseInt(await this.extractParam(
      request,
      requirement.clientIdParam || 'client',
      requirement.resource,
      resourceId
    ));
    
    const instanceId = parseInt(await this.extractParam(
      request,
      requirement.instanceIdParam || 'instance',
      requirement.resource,
      resourceId
    ));

    // Verifica i permessi
    return PermissionsGuard.checkAccess(
      user,
      requirement.resourceType,
      requirement.permissions,
      clientId,
      instanceId
    );
  }

  /**
   * Estrae un parametro da URL params, query params o body
   */
  private async extractParam(request: any, paramName: string, Resource?: ModelStatic<Model>, resourceId?: any): Promise<any>  {

    if(Resource != null){
      const res = await Resource.findByPk(resourceId);
      if(!res) return undefined;
      return res.get(paramName);
    }

    // 1. Prova nei parametri URL (es: /clients/:clientId)
    if (request.params && request.params[paramName]) {
      return request.params[paramName];
    }

    // 2. Prova nei query parameters (es: ?clientId=123)
    if (request.query && request.query[paramName]) {
      return request.query[paramName];
    }

    // 3. Prova nel body (per POST/PUT/PATCH)
    if (request.body && request.body[paramName]) {
      return request.body[paramName];
    }

    return undefined;
  }

  public static async checkAccess(
      user: any,
      resourceType: ResourceType,
      requiredPermissions: {permission: string, level: string}[],
      clientId?: number,
      instanceId?: number
    ): Promise<boolean> {
      if (user.isSuperAdmin) return true;

      if(resourceType == ResourceType.INSTANCE && !instanceId) resourceType = ResourceType.CLIENT;

      switch (resourceType) {
        case ResourceType.INSTANCE:
          if (!instanceId) throw new ForbiddenException('Instance ID is required');
          return this.hasInstanceAccess(user.permissions, instanceId, requiredPermissions);

        case ResourceType.CLIENT:
          if (!clientId) throw new ForbiddenException('Client ID is required');
          return this.hasClientAccess(user.permissions, clientId, requiredPermissions);
          
        default:
          return true;
      }
    }

    private static async hasInstanceAccess(
    permissions:{ client?: number, instance?: number; permissions: {permission: string, level: number}[] }[],
    instanceId: number,
    requiredPermissions: {permission: string, level: string}[]
  ): Promise<boolean> {

    const clientId = (await Instance.findByPk(instanceId))?.get("client")!;

    const hasInstancePermissions = requiredPermissions.every((rp) => {
      return permissions.some(
        (p) => {
          return p.instance === instanceId && p.permissions.some(ip => {
            return ip.permission === rp.permission && this.checkLevel(ip.level, rp.level)
          });
        }
      );
    });
        
    return hasInstancePermissions || this.hasClientAccess(permissions, clientId, requiredPermissions);
  }

  private static hasClientAccess(
    permissions: { client?: number, instance?: number; permissions: {permission: string, level: number}[] }[],
    clientId: number,
    requiredPermissions: {permission: string, level: string}[]
  ): boolean {
    return requiredPermissions.every((rp) => {
      return permissions.some(
        (p) => {
          return p.client === clientId && p.permissions.some(ip => {
            return ip.permission === rp.permission && this.checkLevel(ip.level, rp.level)
          });
        }
      );
    });
  }

  private static checkLevel(level: number, requiredLevel: string): boolean {
    switch (requiredLevel) {
      case 'READ':
        return [7,6,5,4].includes(level) 
      case 'WRITE':
        return [7,6].includes(level) 
      case 'EXECUTE':
        return [7,5].includes(level) 
      default:
        return false;
    }
  }
}
