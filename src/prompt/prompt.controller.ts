import { Controller, Post, Body, UseGuards, Req} from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { User } from "../users/user.model";

@Controller("prompt")
@UseGuards(JwtAuthGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  async create(@Req() req, @Body() promptData: any): Promise<string> {
    const user = req.user!.user as User;
    return this.promptService.send(user, promptData.message);
  }
}
