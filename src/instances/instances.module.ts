import { Module } from "@nestjs/common";
import { InstancesService } from "./instances.service";
import { InstancesController } from "./instances.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Instance } from "./entities/instance.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";

@Module({
  imports: [SequelizeModule.forFeature([Instance])],
  controllers: [InstancesController],
  providers: [InstancesService, JwtAuthGuard, PermissionsGuard],
  exports: [InstancesService],
})
export class InstancesModule {}
