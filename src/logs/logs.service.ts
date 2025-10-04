import { Injectable } from "@nestjs/common";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { Client as OsClient } from "@opensearch-project/opensearch";

@Injectable()
export class LogsService {
  private osClient: OsClient;
  constructor(private readonly osProvider: OpensearchProvider) {
    this.osClient = this.osProvider.getClient();
  }
  async getLogs(params: { client: number } & Record<string, unknown>) {
    const filter = Object.keys(params)
      .filter((key) => params[key] != null) // Filter out null/undefined values
      .map((key) => {
        return {
          term: {
            [key]: {
              value: params[key] as string | number | boolean,
            },
          },
        };
      });

    const res = await this.osClient.search({
      index: `users-logs-${params.client}`,
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
