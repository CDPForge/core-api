import { Post, UseGuards, Body, Controller, Res, Get } from "@nestjs/common";
import { Response } from "express";
import { InstallService } from "./install.service";
import { InstallDto } from "./install.dto";
import { FuxAuthGuard } from "./fux-auth.guard";

@Controller("install")
export class InstallController {
  constructor(private installService: InstallService) {}

  @UseGuards(FuxAuthGuard)
  @Post()
  async install(@Body() installDto: InstallDto, @Res() res: Response) {
    await this.installService.install(installDto);
    return res.sendStatus(200);
  }

  @UseGuards(FuxAuthGuard)
  @Get()
  test(@Res() res: Response) {
    return res.sendStatus(200);
  }
}
