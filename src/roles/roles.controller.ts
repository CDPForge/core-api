import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { IsSuperAdmin } from "../decorators/is-super-admin.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";
import {
  PermissionLevel,
  ResourceType,
  Permissions,
} from "src/decorators/permissions.decorator";

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /*@Post()
  @IsSuperAdmin()
  create(@Body() createRoleDto: Partial<Role>) {
    return this.rolesService.create(createRoleDto);
  }*/

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(+id);
  }

  /*@Patch(":id")
  @IsSuperAdmin()
  update(@Param("id") id: string, @Body() updateRoleDto: Partial<Role>) {
    return this.rolesService.update(+id, updateRoleDto);
  }*/

  @Delete(":id")
  @IsSuperAdmin()
  remove(@Param("id") id: string) {
    return this.rolesService.remove(+id);
  }

  @Get("/user/:id")
  async getUser(@Param("id") id: number) {
    return this.rolesService.findUserRoles(id);
  }

  @Get("/user/")
  async getAllUser() {
    return this.rolesService.findAllUsersRoles();
  }

  @Put("/user/:id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    permissions: [
      { permission: "client.management", level: PermissionLevel.WRITE },
    ],
  })
  async addToUser(
    @Param("userid") id: number,
    @Body("instance") instance: number,
    @Body("client") client: number,
    @Body("roles") permission: number[],
  ) {
    return await this.rolesService.addUserRoles(
      id,
      client,
      instance,
      permission,
    );
  }
  @Delete("/user/:id")
  @IsSuperAdmin()
  async removeFromUser(
    @Param("userid") id: number,
    @Body("instance") instance: number,
    @Body("roles") permission: number[],
  ) {
    return await this.rolesService.removeUserRoles(id, instance, permission);
  }

  @Post("/user/:id")
  @IsSuperAdmin()
  async setUserRoles(
    @Param("userid") id: number,
    @Body("rolesMap")
    rolesMap: { client: number; instance: number; roles: number[] }[],
  ) {
    return await this.rolesService.setUserRoles(id, rolesMap);
  }
}
