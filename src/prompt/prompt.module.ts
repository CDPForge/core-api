import { Module } from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { PromptController } from "./prompt.controller";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [PromptService, JwtAuthGuard],
  controllers: [PromptController],
})
export class PromptModule {}
