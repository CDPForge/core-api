import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import {PermissionsGuard} from "../auth/permission.guard";
import {Permissions} from "../decorators/permissions.decorator";

@Controller("prompt")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('prompt')
  async create(@Body() promptData: any): Promise<string> {
    return this.promptService.send(promptData.message);
  }
}
