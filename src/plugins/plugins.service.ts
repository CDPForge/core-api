import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Plugin } from "./plugin.model";
import { PluginPipeline } from "../types/plugins";

@Injectable()
export class PluginsService {
  constructor(
    @InjectModel(Plugin)
    private pluginModel: typeof Plugin,
  ) {}

  // Aggiungi qui i metodi per interagire con il database (es. create, findAll, findOne, update, remove)
  async findAll(): Promise<Plugin[]> {
    return this.pluginModel.findAll();
  }

  async findOne(id: number): Promise<Plugin | null> {
    return this.pluginModel.findByPk(id);
  }

  async getPluginPipeline(): Promise<PluginPipeline | null> {
    const plugins = await this.findAll();
    if (!plugins || plugins.length === 0) {
      return null; // No plugins found
    }

    const firstTopic = process.env.PIPELINEMANAGER_FIRST_TOPIC;
    if (!firstTopic) {
      console.error(
        "PIPELINEMANAGER_FIRST_TOPIC environment variable not set.",
      );
      return null; // First topic not defined
    }

    // Find the root plugin(s) - plugin(s) whose input_topic matches the firstTopic
    const rootPlugins = plugins.filter(
      (plugin) => plugin.input_topic === firstTopic,
    );

    if (rootPlugins.length === 0) {
      console.error(
        `No plugin found with input_topic matching PIPELINEMANAGER_FIRST_TOPIC: ${firstTopic}`,
      );
      return null; // No root plugin found
    }

    const rootPlugin = rootPlugins[0];

    // Build the pipeline recursively
    const buildPipeline = (
      currentPlugin: Plugin,
      allPlugins: Plugin[],
    ): PluginPipeline => {
      const childrenPlugins = allPlugins.filter(
        (plugin) => plugin.input_topic === currentPlugin.output_topic,
      );
      const childrenPipelines = childrenPlugins.map((childPlugin) =>
        buildPipeline(childPlugin, allPlugins),
      );

      return {
        plugin: currentPlugin,
        children: childrenPipelines.length > 0 ? childrenPipelines : undefined,
      };
    };

    return buildPipeline(rootPlugin, plugins);
  }
}
