import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { InstancesService } from "./instances.service";
import { CreateInstanceDto } from "./dto/create-instance.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Instance } from "./entities/instance.entity";
import { PermissionsGuard } from "../auth/permission.guard";
import { Permissions } from "../decorators/permissions.decorator";

@Controller("instances")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
  @Permissions("instance.management")
  create(@Body() createInstanceDto: CreateInstanceDto) {
    return this.instancesService.create(createInstanceDto);
  }

  @Get()
  findAll() {
    return this.instancesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.instancesService.findOne(id);
  }

  @Patch(":id")
  @Permissions("instance.management")
  update(
    @Param("id") id: number,
    @Body() updateInstanceDto: Partial<Instance>,
  ) {
    return this.instancesService.update(id, updateInstanceDto);
  }

  @Delete(":id")
  @Permissions("instance.management")
  remove(@Param("id") id: number) {
    return this.instancesService.remove(id);
  }
}
