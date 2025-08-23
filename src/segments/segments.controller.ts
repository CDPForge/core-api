import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
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
  update(@Param('id') id: string, @Body() updateSegmentDto: UpdateSegmentDto) {
    return this.segmentsService.update(+id, updateSegmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.segmentsService.remove(+id);
  }

  @Get(':id/results')
  findResults(
    @Param('id') id: string,
    @Query('size') size?: string,
    @Query('scroll_id') scroll_id?: string,
  ) {
    return this.segmentsService.findResults(+id, size ? +size : 10, scroll_id);
  }
}
