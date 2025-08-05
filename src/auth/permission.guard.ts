// src/common/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_SUPER_ADMIN_KEY } from "../decorators/is-super-admin.decorator";
import { User } from "../users/user.model";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: {
      sub: string;
      user: Partial<User>;
      permissions: { instance: number; permissions: string[] }[];
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

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se l'endpoint non ha un decorator @Permissions, non ci sono permessi da controllare.
    if (!requiredPermissions) {
      return true;
    }

    // Estrai l'ID dell'istanza dall'header custom
    let headerValue = request.headers["x-instance-id"];

    if (!headerValue) {
      throw new ForbiddenException("X-Instance-Id header is required.");
    }

    let requestedInstanceIds: number[];

    // Gestisce sia array che stringa singola
    if (Array.isArray(headerValue)) {
      // Header multipli - Express li mette in array
      requestedInstanceIds = headerValue.flatMap(v => v.split(",").map(id => parseInt(id.trim())));
    } else if (headerValue.startsWith('[')) {
      // JSON array
      requestedInstanceIds = JSON.parse(headerValue).map((v: any) => parseInt(v));
    } else {
      // Stringa separata da virgole
      requestedInstanceIds = headerValue.split(",").map(v => parseInt(v.trim()));
    }

    if (requestedInstanceIds.some((i: number) => isNaN(i))) {
      throw new ForbiddenException(
        "X-Instance-Id header is missing or not a valid number.",
      );
    }

    const hasAllPermissions = requiredPermissions.every(rp => {
      return requestedInstanceIds.every( ri => {
        return user.permissions.some((p) => p.instance === ri && p.permissions.includes(rp));
      });
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions.join(", ")} for instances: ${requestedInstanceIds.join(", ")}`
      );
    }

    return true;
  }
}
