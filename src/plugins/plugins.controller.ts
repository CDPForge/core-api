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

  // Esempi di altri endpoint (dovrai implementare i metodi corrispondenti nel service):
  // @Post()
  // async create(@Body() pluginData: any): Promise<Plugin> { ... }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() pluginData: any): Promise<[number, Plugin[]]> { ... }

  // @Delete(':id')
  // async remove(@Param('id') id: string): Promise<void> { ... }
}
