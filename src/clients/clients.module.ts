import { Module } from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { ClientsController } from "./clients.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Client } from "./entities/client.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SettingsModule } from "../settings/settings.module";
import { SettingsService } from "../settings/settings.service";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { OpensearchModule } from "../opensearch/opensearch.module";

@Module({
  imports: [
    SequelizeModule.forFeature([Client]),
    SettingsModule,
    OpensearchModule,
  ],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    JwtAuthGuard,
    SettingsService,
    OpensearchProvider,
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
