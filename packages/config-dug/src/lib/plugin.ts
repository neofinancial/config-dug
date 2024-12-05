import ms from 'ms';

import { ConfigDugSchema, UntypedConfig, ValueOrigins } from '../config-dug.js';
import { ConfigDugOptions } from './options.js';

export type ConfigDugPluginOutput = {
  nextReloadIn?: number;
  schema?: ConfigDugSchema;
  values: UntypedConfig;
  valueOrigins: ValueOrigins;
};

export interface ConfigDugPlugin {
  initialize?: (configDugOptions: ConfigDugOptions, environmentVariables: UntypedConfig) => Promise<void>;
  load?: () => Promise<ConfigDugPluginOutput>;
  reload?: () => Promise<ConfigDugPluginOutput>;
  getPluginKeyStyle(): KeyStyle;
  getNextReloadIn(): number | undefined;
}

export enum KeyStyle {
  camelCase = 'camelCase',
  capitalCase = 'capitalCase',
  constantCase = 'constantCase',
  dotCase = 'dotCase',
  kebabCase = 'kebabCase',
  noCase = 'noCase',
  pascalCase = 'pascalCase',
  pascalSnakeCase = 'pascalSnakeCase',
  pathCase = 'pathCase',
  sentenceCase = 'sentenceCase',
  snakeCase = 'snakeCase',
  trainCase = 'trainCase',
}

export interface ConfigDugPluginOptions {
  reloadInterval?: string | number;
  pluginKeyStyle?: KeyStyle;
}

export abstract class BaseConfigDugPlugin<T extends ConfigDugPluginOptions> {
  protected nextReloadAt: number | undefined;
  protected pluginOptions: T;

  public constructor(options: T) {
    this.pluginOptions = options;

    const nextReloadIn = this.getNextReloadIn();

    this.nextReloadAt = nextReloadIn ? nextReloadIn + Date.now() : undefined;
  }

  public abstract initialize(configDugOptions: ConfigDugOptions, environmentVariables: UntypedConfig): Promise<void>;
  public abstract load(): Promise<ConfigDugPluginOutput>;

  public getNextReloadIn(): number | undefined {
    if (!this.pluginOptions.reloadInterval) {
      return;
    }

    if (typeof this.pluginOptions.reloadInterval === 'string') {
      const reloadIn = ms(this.pluginOptions.reloadInterval);

      return reloadIn;
    } else if (typeof this.pluginOptions.reloadInterval === 'number') {
      return this.pluginOptions.reloadInterval;
    }
  }

  public getPluginKeyStyle(): KeyStyle {
    return this.pluginOptions.pluginKeyStyle ?? KeyStyle.noCase;
  }

  public async reload(): Promise<ConfigDugPluginOutput | undefined> {
    if (!this.nextReloadAt || this.nextReloadAt > Date.now()) {
      return;
    }

    const loadOutput = await this.load();

    this.nextReloadAt = loadOutput.nextReloadIn ? loadOutput.nextReloadIn + Date.now() : undefined;

    return loadOutput;
  }
}
