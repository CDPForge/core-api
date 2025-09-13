import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query, UseGuards,
} from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {PermissionsGuard} from "../auth/permission.guard";
import {Permissions} from "../decorators/permissions.decorator";

@Controller('segments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @Permissions("instance.management")
  create(@Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(createSegmentDto);
  }

  @Get()
  findAll() {
    return this.segmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.segmentsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions("instance.management")
  update(@Param('id') id: string, @Body() updateSegmentDto: UpdateSegmentDto) {
    return this.segmentsService.update(+id, updateSegmentDto);
  }

  @Delete(':id')
  @Permissions("instance.management")
  remove(@Param('id') id: string) {
    return this.segmentsService.remove(+id);
  }

  @Get(':id/results')
  @Permissions("instance.management")
  findResults(
    @Param('id') id: string,
    @Query('size') size?: string,
    @Query('after_key') after_key?: string,
  ) {
    return this.segmentsService.findResults(+id, size ? +size : 100, after_key);
  }

  @Get('mapping/:clientId')
  @Permissions("instance.management")
  getMapping(@Param('clientId') clientId: string) {
    return this.segmentsService.getMapping(+clientId);
  }
}
