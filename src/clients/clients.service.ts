import { Injectable } from "@nestjs/common";
import { Client } from "./entities/client.entity";
import { Instance } from "../instances/entities/instance.entity";
import { Transaction } from "sequelize";
import { Client as OsClient } from "@opensearch-project/opensearch";
import { SettingsService } from "../settings/settings.service";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { col, fn } from "sequelize";

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

    const indexTemplateBody = await this.settingService.get("os.indextemplate");
    if (!indexTemplateBody) {
      throw new Error("Index template not found");
    }

    const templateString = indexTemplateBody.replaceAll(
      "${client_id}",
      (client.id as number).toString(),
    );
    const templateBody = JSON.parse(templateString) as Record<string, unknown>;

    await this.osClient.indices.putIndexTemplate({
      name: `users-logs-${client.id as number}-template`,
      body: templateBody,
    });

    //TODO: potremmo essere sotto transaction qui... creiamo l'indice anche in caso di rollback
    await this.osClient.indices.create({
      index: `users-logs-${client.id as number}-000001`
    });

    return client;
  }

  async findAll() {
    return await Client.findAll({
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

  async findAllWithInstances() {
    return await Client.findAll({
      include: [
        {
          model: Instance,
          attributes: ["id", "name", "description", "active"],
          required: false,
        },
      ],
      order: [
        ["id", "ASC"],
        ["instances", "name", "ASC"],
      ],
    });
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
