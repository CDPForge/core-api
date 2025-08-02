import { Injectable } from "@nestjs/common";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { Client as OsClient } from "@opensearch-project/opensearch";

@Injectable()
export class LogsService {
  private osClient: OsClient;
  constructor(private readonly osProvider: OpensearchProvider) {
    this.osClient = this.osProvider.getClient();
  }
  async getLogs(params: { client: number } & any) {
    const filter = Object.keys(params).map((key) => {
      return { term: { [key]: params[key] } };
    });

    const res = await this.osClient.search({
      index: "users-logs-" + params.client,
      body: {
        size: 10,
        sort: [
          {
            date: {
              order: "desc",
            },
          },
        ],
        query: {
          bool: {
            filter: filter,
          },
        },
      },
    });
    return res.body.hits.hits.map((hit) => hit._source);
  }
}
