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

@Controller("instances")
@UseGuards(JwtAuthGuard)
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
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
  update(
    @Param("id") id: number,
    @Body() updateInstanceDto: Partial<Instance>,
  ) {
    return this.instancesService.update(id, updateInstanceDto);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.instancesService.remove(id);
  }
}
