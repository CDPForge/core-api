import { Controller, Get, Param } from "@nestjs/common";
import { PluginsService } from "./plugins.service";
import { Plugin } from "./plugin.model";

@Controller("plugins") // Definisce il percorso base per gli endpoint dei plugin
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  async findAll(): Promise<Plugin[]> {
    return this.pluginsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: number): Promise<Plugin | null> {
    return await this.pluginsService.findOne(id);
  }
}
