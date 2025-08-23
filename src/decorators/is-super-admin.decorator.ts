// src/common/decorators/is-super-admin.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const IS_SUPER_ADMIN_KEY = "isSuperAdmin";
export const IsSuperAdmin = () => SetMetadata(IS_SUPER_ADMIN_KEY, true);
