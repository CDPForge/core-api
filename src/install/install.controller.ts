import { Post, UseGuards, Body, Controller, Res } from "@nestjs/common";
import { Response } from "express";
import { InstallService } from "./install.service";
import { InstallDto } from "./install.dto";
import { FuxAuthGuard } from "./fux-auth.guard";

@Controller()
export class InstallController {
  constructor(private installService: InstallService) {}

  @UseGuards(FuxAuthGuard)
  @Post("install")
  async install(@Body() installDto: InstallDto, @Res() res: Response) {
    await this.installService.install(installDto);
    return res.sendStatus(200);
  }
}
