import { PartialType } from '@nestjs/mapped-types';
import { CreateSegmentDto } from './create-segment.dto';

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) {}
