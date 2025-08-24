import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Segment } from './entities/segment.entity';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { OpensearchModule } from '../opensearch/opensearch.module';

@Module({
  imports: [SequelizeModule.forFeature([Segment]), OpensearchModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
})
export class SegmentsModule {}
