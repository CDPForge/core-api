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
import { UpdateInstanceDto } from "./dto/update-instance.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

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
  findOne(@Param("id") id: string) {
    return this.instancesService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateInstanceDto: UpdateInstanceDto,
  ) {
    return this.instancesService.update(+id, updateInstanceDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.instancesService.remove(+id);
  }
}
