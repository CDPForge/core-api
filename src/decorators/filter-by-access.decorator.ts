import { SetMetadata } from "@nestjs/common";
import { PermissionLevel } from "./permissions.decorator";

// decorators/filter-by-access.decorator.ts
export const FILTER_BY_ACCESS_KEY = "filterByAccess";

export interface FilterConfig {
  permission: string;
  level: PermissionLevel;
  instanceParam?: string;
  clientParam?: string;
}

export const FilterByAccess = (config: FilterConfig) =>
  SetMetadata(FILTER_BY_ACCESS_KEY, config);
