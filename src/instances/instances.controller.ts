import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { InstancesService } from "./instances.service";
import { CreateInstanceDto } from "./dto/create-instance.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Instance } from "./entities/instance.entity";
import { PermissionsGuard } from "../auth/permission.guard";
import {
  PermissionLevel,
  Permissions,
  ResourceType,
} from "../decorators/permissions.decorator";
import { AccessFilterInterceptor } from "src/interceptors/access-filter.interceptor";
import { FilterByAccess } from "src/decorators/filter-by-access.decorator";

@Controller("instances")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "client",
    permissions: [
      { permission: "instance.management", level: PermissionLevel.WRITE },
    ],
  })
  create(@Body() createInstanceDto: CreateInstanceDto) {
    return this.instancesService.create(createInstanceDto);
  }

  @Get()
  @UseInterceptors(AccessFilterInterceptor)
  @FilterByAccess({
    permission: "instance.management",
    level: PermissionLevel.READ,
    instanceParam: "id",
  })
  findAll() {
    return this.instancesService.findAll();
  }

  @Get(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    instanceIdParam: "id",
    permissions: [
      { permission: "instance.management", level: PermissionLevel.READ },
    ],
  })
  findOne(@Param("id") id: number) {
    return this.instancesService.findOne(id);
  }

  @Patch(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    instanceIdParam: "id",
    permissions: [
      { permission: "instance.management", level: PermissionLevel.WRITE },
    ],
  })
  update(
    @Param("id") id: number,
    @Body() updateInstanceDto: Partial<Instance>,
  ) {
    return this.instancesService.update(id, updateInstanceDto);
  }

  @Delete(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    instanceIdParam: "id",
    permissions: [
      { permission: "instance.management", level: PermissionLevel.WRITE },
    ],
  })
  remove(@Param("id") id: number) {
    return this.instancesService.remove(id);
  }
}
