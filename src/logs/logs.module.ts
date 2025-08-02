import { Module } from "@nestjs/common";
import { LogsService } from "./logs.service";
import { LogsController } from "./logs.controller";
import {OpensearchProvider} from "../opensearch/opensearch.provider";

@Module({
  controllers: [LogsController],
  providers: [LogsService, OpensearchProvider],
})
export class LogsModule {}
