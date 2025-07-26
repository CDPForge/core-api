import { Injectable } from "@nestjs/common";
import { Client } from "@opensearch-project/opensearch";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class OpensearchProvider {
  private readonly client: Client;
  constructor(private configService: ConfigService) {
    this.client = new Client({
      node: this.configService.get("OPENSEARCH_URL")!,
      auth: {
        username: this.configService.get("OPENSEARCH_USERNAME")!,
        password: this.configService.get("OPENSEARCH_PASSWORD")!,
      },
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, "../../certs/root-ca.pem")),
        rejectUnauthorized: true,
      },
    });
  }

  getClient(): Client {
    return this.client;
  }
}
