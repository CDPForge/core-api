import { Plugin } from "../plugins/plugin.model";
export interface PluginPipeline {
  plugin: Plugin;
  children?: PluginPipeline[];
}
