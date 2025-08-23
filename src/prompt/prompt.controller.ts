import { Controller, Post, Body, UseGuards, Req} from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import {PermissionsGuard} from "../auth/permission.guard";
import {Permissions} from "../decorators/permissions.decorator";
import { User } from "../users/user.model";

@Controller("prompt")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('prompt')
  async create(@Req() req, @Body() promptData: any): Promise<string> {
    const user = req.user!.user as User;
    return this.promptService.send(user, promptData.message);
  }
}
