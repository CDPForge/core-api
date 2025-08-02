import { Injectable } from "@nestjs/common";
import { Instance } from "./entities/instance.entity";
import { Transaction } from "sequelize";

@Injectable()
export class InstancesService {
  async create(
    instance: Partial<Instance>,
    options?: { transaction?: Transaction },
  ) {
    return await Instance.create(instance, options);
  }

  async findAll() {
    return await Instance.findAll({
      include: ["clientEntity"],
    });
  }

  async findOne(id: number) {
    return await Instance.findByPk(id, { include: ["clientEntity"] });
  }

  async update(
    id: number,
    updateInstanceDto: Partial<Instance>,
    options?: { transaction?: Transaction },
  ) {
    return await Instance.update(updateInstanceDto, {
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }

  async remove(id: number, options?: { transaction?: Transaction }) {
    return await Instance.destroy({
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }

  async count(): Promise<number> {
    return await Instance.count();
  }
}
