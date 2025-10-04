import { Model } from "sequelize-typescript";
import { ModelStatic } from "sequelize";
import { SetMetadata} from '@nestjs/common';

export enum ResourceType {
  CLIENT = 'client',
  INSTANCE = 'instance',
  NONE = 'none'
}

export enum PermissionLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  EXECUTE = 'EXECUTE'
}

export interface AccessRequirement {
  resourceType: ResourceType;
  clientIdParam?: string;  // nome del parametro clientId
  instanceIdParam?: string; // nome del parametro instanceId
  resource?: ModelStatic<Model>,
  resourceIdParam?: string,
  permissions: {permission: string, level: string}[];
}

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (config: AccessRequirement) => 
  SetMetadata(PERMISSIONS_KEY, config);