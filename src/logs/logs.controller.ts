import { Controller, Get, Query, Res } from "@nestjs/common";
import { LogsService } from "./logs.service";
import { Response } from "express";

@Controller("logs")
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async get(@Query() query: any | null, @Res() response: Response) {
    if (query.client == null) return response.sendStatus(400);
    return response.json(await this.logsService.getLogs(query));
  }
}
