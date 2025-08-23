import { Module } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { RolesController } from "./roles.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Role } from "./entities/role.entity";
import { UserRole } from "./entities/userRole.entity";
import { RolePermission } from "./entities/rolePermission.entity";
import {InstancesModule} from "../instances/instances.module";

@Module({
  imports: [SequelizeModule.forFeature([Role, UserRole, RolePermission]), InstancesModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
