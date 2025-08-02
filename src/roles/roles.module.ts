import { Module } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { RolesController } from "./roles.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Role } from "./entities/role.entity";
import { UserRole } from "./entities/userRole.entity";
import { RolePermission } from "./entities/rolePermission.entity";

@Module({
  imports: [SequelizeModule.forFeature([Role, UserRole, RolePermission])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
