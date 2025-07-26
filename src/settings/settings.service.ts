import { Injectable } from "@nestjs/common";
import { CreateSettingDto } from "./dto/create-setting.dto";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { Setting } from "./entities/setting.entity";

@Injectable()
export class SettingsService {
  create(createSettingDto: CreateSettingDto) {
    return "This action adds a new setting";
  }

  async get(field: string, client?: number) {
    const where: any = { field };
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

  update(id: number, updateSettingDto: UpdateSettingDto) {
    return `This action updates a #${id} setting`;
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
