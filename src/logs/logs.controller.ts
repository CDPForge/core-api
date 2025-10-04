import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { LogsService } from "./logs.service";
import { Response } from "express";
import {
  PermissionLevel,
  Permissions,
  ResourceType,
} from "../decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";

@Controller("logs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "client",
    permissions: [
      { permission: "instance.management", level: PermissionLevel.WRITE },
    ],
  })
  async get(@Query() query: any | null, @Res() response: Response) {
    if (query.client == null) return response.sendStatus(400);
    return response.json(await this.logsService.getLogs(query));
  }
}
