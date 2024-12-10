import ms from 'ms';

import { ConfigDugSchema, UntypedConfig, ValueOrigins } from '../config-dug.js';
import { ConfigDugOptions } from './options.js';
import { z } from 'zod';

export type ConfigDugPluginOutput = {
  nextReloadIn?: number;
  schema?: ConfigDugSchema;
  values: UntypedConfig;
  valueOrigins: ValueOrigins;
};

const ConfigDugPluginOutputSchema = z.object({
  nextReloadIn: z.number().optional(),
  schema: z.record(z.ZodType.prototype).optional(),
  values: z.record(z.unknown()),
  valueOrigins: z.record(z.array(z.string())),
});

export interface ConfigDugPlugin {
  initialize?: (configDugOptions: ConfigDugOptions, environmentVariables: UntypedConfig) => Promise<void>;
  load?: () => Promise<ConfigDugPluginOutput>;
  reload?: () => Promise<ConfigDugPluginOutput | undefined>;
  getPluginKeyStyle(): KeyStyle;
  getNextReloadIn(): number | undefined;
}

export enum KeyStyle {
  camelCase = 'camelCase',
  capitalCase = 'capitalCase',
  constantCase = 'constantCase',
  dotCase = 'dotCase',
  noCase = 'noCase',
  pascalCase = 'pascalCase',
  pathCase = 'pathCase',
  sentenceCase = 'sentenceCase',
  snakeCase = 'snakeCase',
}

export const pluginSchema = z.object({
  initialize: z.function(),
  load: z.function().returns(z.promise(ConfigDugPluginOutputSchema)),
  reload: z.function().returns(z.promise(ConfigDugPluginOutputSchema)),
  getPluginKeyStyle: z.function().returns(z.nativeEnum(KeyStyle)),
  getNextReloadIn: z.function().returns(z.number().optional()),
});

export interface ConfigDugPluginOptions {
  reloadInterval?: string | number;
  pluginKeyStyle?: KeyStyle;
}

export abstract class BaseConfigDugPlugin<T extends ConfigDugPluginOptions> implements ConfigDugPlugin {
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
