import { Module } from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { PromptController } from "./prompt.controller";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { ClientsModule } from "src/clients/clients.module";

@Module({
  imports: [AuthModule, ClientsModule],
  providers: [PromptService, JwtAuthGuard],
  controllers: [PromptController],
})
export class PromptModule {}
