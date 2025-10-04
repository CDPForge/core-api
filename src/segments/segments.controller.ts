import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SegmentsService } from "./segments.service";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { UpdateSegmentDto } from "./dto/update-segment.dto";
import { PreviewSegmentDto } from "./dto/preview-segment.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";
import { PermissionLevel, Permissions, ResourceType } from "../decorators/permissions.decorator";
import { Segment } from "./entities/segment.entity";

@Controller("segments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    permissions: [{permission:"segments.management", level: PermissionLevel.WRITE}],
  })
  create(@Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(createSegmentDto);
  }

  @Post("preview")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    instanceIdParam: "instanceId",
    clientIdParam: "clientId",
    permissions: [{permission:"segments.management", level: PermissionLevel.EXECUTE}],
  })
  preview(@Body() previewDto: PreviewSegmentDto) {
    return this.segmentsService.preview(previewDto);
  }

  @Get()
  findAll() {
    return this.segmentsService.findAll();
  }

  @Get(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    resource: Segment,
    resourceIdParam: "id",
    permissions: [{permission:"segments.management", level: PermissionLevel.READ}],
  })
  findOne(@Param("id") id: string) {
    return this.segmentsService.findOne(+id);
  }

  @Patch(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    resource: Segment,
    resourceIdParam: "id",
    permissions: [{permission:"segments.management", level: PermissionLevel.WRITE}],
  })
  update(@Param("id") id: string, @Body() updateSegmentDto: UpdateSegmentDto) {
    return this.segmentsService.update(+id, updateSegmentDto);
  }

  @Delete(":id")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    resource: Segment,
    resourceIdParam: "id",
    permissions: [{permission:"segments.management", level: PermissionLevel.WRITE}],
  })
  remove(@Param("id") id: string) {
    return this.segmentsService.remove(+id);
  }

  @Get(":id/results")
  @Permissions({
    resourceType: ResourceType.INSTANCE,
    resource: Segment,
    resourceIdParam: "id",
    permissions: [{permission:"segments.management", level: PermissionLevel.EXECUTE}],
  })
  findResults(
    @Param("id") id: number,
    @Query("size") size?: number,
    @Query("after_key") after_key?: string,
  ) {
    return this.segmentsService.findResults(id, size ? size : 100, after_key);
  }

  @Get("mapping/:clientId")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "clientId",
    permissions: [{permission:"segments.management", level: PermissionLevel.READ}],
  })
  getMapping(@Param("clientId") clientId: number) {
    return this.segmentsService.getMapping(clientId);
  }
}
