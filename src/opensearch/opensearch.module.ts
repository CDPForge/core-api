import { Module } from "@nestjs/common";
import { OpensearchProvider } from "./opensearch.provider";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  providers: [OpensearchProvider],
  exports: [OpensearchProvider],
})
export class OpensearchModule {}
