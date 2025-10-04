import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { Response } from "express";
import { InstancesService } from "../instances/instances.service";
import { Instance } from "../instances/entities/instance.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionLevel, ResourceType, Permissions } from "src/decorators/permissions.decorator";
import { Permission } from "./entities/permission.entity";

@Controller("permissions")
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly instancesService: InstancesService,
  ) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.permissionsService.findOne(+id);
  }

  @Get("/user/:id")
  async findUserPermssions(
    @Param("id") id: number,
    @Query("client") client: number | null,
    @Query("instance") instance: number | null,
    @Res() res: Response,
  ) {
    if (client == null && instance == null) {
      return res.status(400).send("You must specify a client or an instance");
    }
    let instanceEntity: Instance | null = null;
    if (instance != null) {
      instanceEntity = await this.instancesService.findOne(instance);
      if (instanceEntity == null) {
        return res.status(404).send("The instance specified does not exist");
      }
      if (client != null && client !== instanceEntity?.client) {
        return res
          .status(400)
          .send(
            "The instance specified is not the one of the client specified",
          );
      }
      client = instanceEntity!.client;
    }

    const permissions = await this.permissionsService.findUserPermissions(
      id,
      client!,
      instance,
    );
    return res.json(permissions);
  }
}
