import { Module } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { PermissionsController } from "./permissions.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Permission } from "./entities/permission.entity";
import { InstancesModule } from "../instances/instances.module";
@Module({
  imports: [SequelizeModule.forFeature([Permission]), InstancesModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
