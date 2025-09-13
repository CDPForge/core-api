import { Injectable } from "@nestjs/common";
import { Client } from "./entities/client.entity";
import { Instance } from "../instances/entities/instance.entity";
import { Transaction } from "sequelize";
import { Client as OsClient } from "@opensearch-project/opensearch";
import { SettingsService } from "../settings/settings.service";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { col, fn, Op } from "sequelize";

@Injectable()
export class ClientsService {
  private osClient: OsClient;
  constructor(
    private readonly osProvider: OpensearchProvider,
    private readonly settingService: SettingsService,
  ) {
    this.osClient = this.osProvider.getClient();
  }

  async create(
    clientBody: Partial<Client>,
    options?: { transaction?: Transaction },
  ) {
    const client = await Client.create(clientBody, options);

    const indexTemplate = await this.settingService.get("os.indexsetting");
    if (!indexTemplate) {
      throw new Error("Index setting not found");
    }

    const indexString = indexTemplate.replaceAll(
      "${client_id}",
      client.id.toString(),
    );
    const indexBody = JSON.parse(indexString);

    //TODO: potremmo essere sotto transaction qui... creiamo l'indice anche in caso di rollback
    await this.osClient.indices.create({
      index: `users-logs-${client.id}-000001`,
      body: indexBody,
    });

    return client;
  }

  async findAll(user: any) {
    const findOptions: any = {
      attributes: {
        include: [[fn("COUNT", col("instances.id")), "instancesCount"]],
      },
      include: [
        {
          model: Instance,
          attributes: [],
          required: false,
        },
      ],
      group: ["Client.id"],
      raw: false,
      nest: true,
    };

    if (user && !user.isSuperAdmin) {
      const clientIds = user.permissions.map((p) => p.client);
      findOptions.where = {
        id: {
          [Op.in]: clientIds,
        },
      };
    }

    return await Client.findAll(findOptions);
  }

  async findOne(id: number) {
    return await Client.findByPk(id, {
      attributes: {
        include: [[fn("COUNT", col("instances.id")), "instancesCount"]],
      },
      include: [
        {
          model: Instance,
          attributes: [],
          required: false,
        },
      ],
      group: ["Client.id"],
      raw: false,
      nest: true,
    });
  }

  async update(
    id: number,
    client: Partial<Client>,
    options?: { transaction?: Transaction },
  ) {
    return await Client.update(client, {
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }

  async remove(id: number, options?: { transaction?: Transaction }) {
    return await Client.destroy({
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }

  async count(): Promise<number> {
    return await Client.count();
  }
}
