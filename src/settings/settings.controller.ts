import { Controller, Get, Param, Delete } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { IsSuperAdmin } from "src/decorators/is-super-admin.decorator";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /*@Post()
  @IsSuperAdmin()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }*/

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.settingsService.findOne(+id);
  }

  /*@Patch(":id")
  @IsSuperAdmin()
  update(@Param("id") id: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(+id, updateSettingDto);
  }*/

  @Delete(":id")
  @IsSuperAdmin()
  remove(@Param("id") id: string) {
    return this.settingsService.remove(+id);
  }
}
