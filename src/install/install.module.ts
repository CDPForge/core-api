import { Module } from "@nestjs/common";
import { InstallService } from "./install.service";
import { InstallController } from "./install.controller";
import { UsersModule } from "../users/users.module";
import { FuxAuthGuard } from "./fux-auth.guard";
import { ClientsModule } from "../clients/clients.module";
import { InstancesModule } from "../instances/instances.module";

@Module({
  imports: [UsersModule, ClientsModule, InstancesModule],
  providers: [InstallService, FuxAuthGuard],
  controllers: [InstallController],
  exports: [],
})
export class InstallModule {}
