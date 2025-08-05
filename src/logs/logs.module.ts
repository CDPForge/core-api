import { Module } from "@nestjs/common";
import { LogsService } from "./logs.service";
import { LogsController } from "./logs.controller";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { PermissionsGuard } from "../auth/permission.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  controllers: [LogsController],
  providers: [LogsService, OpensearchProvider, JwtAuthGuard, PermissionsGuard],
})
export class LogsModule {}
