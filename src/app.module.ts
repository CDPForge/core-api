import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module"; // Assicurati che il tuo UsersModule sia importato
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config"; // Se usi @nestjs/config
import { PluginsModule } from "./plugins/plugins.module";
import { ClientsModule } from "./clients/clients.module";
import { InstancesModule } from "./instances/instances.module";
import { OpensearchProvider } from "./opensearch/opensearch.provider";
import { OpensearchModule } from "./opensearch/opensearch.module";
import { SettingsModule } from "./settings/settings.module";
import { InstallModule } from "./install/install.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule], // Importa ConfigModule se usi ConfigService
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MYSQL_URI"),
        dialect: "mysql",
        autoLoadModels: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    PluginsModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    InstancesModule,
    OpensearchModule,
    SettingsModule,
    InstallModule,
  ],
  controllers: [AppController],
  providers: [AppService, OpensearchProvider],
})
export class AppModule {}
