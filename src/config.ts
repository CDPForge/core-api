import YAML from 'yaml';
import * as fs from 'fs';
import path from 'path';

export default class Config {
  private static instance: Config;
  private readonly configData: any;

  private constructor() {
    try {
      const fileContents = fs.readFileSync(path.join(__dirname, '../config/config.yml'), 'utf8');
      this.configData = YAML.parse(fileContents);
    } catch (e) {
      console.error('Error reading or parsing config.yml:', e);
      throw e;
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get config(): any {
      return this.configData
  }
}
