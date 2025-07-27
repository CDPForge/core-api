import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("prompt")
@UseGuards(JwtAuthGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() promptData: any): Promise<string> {
    return this.promptService.send(promptData.message);
  }
}
