import { Injectable } from "@nestjs/common";

import { Setting } from "./entities/setting.entity";

@Injectable()
export class SettingsService {
  create() {
    return "This action adds a new setting";
  }

  async get(field: string, client?: number) {
    const where: Record<string, unknown> = { field };
    if (client !== undefined) {
      where.client = client;
    }
    const setting = await Setting.findOne({ where });
    return setting?.get("value");
  }

  findAll() {
    return `This action returns all settings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} setting`;
  }

  update(id: number) {
    return `This action updates a #${id} setting`;
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
