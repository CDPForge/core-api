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
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";
import { IsSuperAdmin } from "../decorators/is-super-admin.decorator";
import {
  PermissionLevel,
  ResourceType,
  Permissions,
} from "src/decorators/permissions.decorator";
import { FilterByAccess } from "src/decorators/filter-by-access.decorator";
import { AccessFilterInterceptor } from "src/interceptors/access-filter.interceptor";

@Controller("clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @IsSuperAdmin()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @UseInterceptors(AccessFilterInterceptor)
  @FilterByAccess({
    permission: "client.management",
    level: PermissionLevel.READ,
    clientParam: "id"
  })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get("with-instances")
  findAllWithInstances() {
    return this.clientsService.findAllWithInstances();
  }

  @Get(":id")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "id",
    permissions: [
      { permission: "client.management", level: PermissionLevel.READ },
    ],
  })
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(+id);
  }

  @Patch(":id")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "id",
    permissions: [
      { permission: "client.management", level: PermissionLevel.WRITE },
    ],
  })
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Delete(":id")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "id",
    permissions: [
      { permission: "client.management", level: PermissionLevel.WRITE },
    ],
  })
  remove(@Param("id") id: string) {
    return this.clientsService.remove(+id);
  }
}
