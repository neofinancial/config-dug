import ms from 'ms';

import { ConfigDugSchema, DeepReadonlyObject, TypedConfig, UntypedConfig, ValueOrigins } from '../config-dug.js';
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
  isInitialized: () => boolean;
  initialize: (
    configDugOptions: ConfigDugOptions,
    currentConfig: DeepReadonlyObject<TypedConfig<any>>
  ) => Promise<void>;
  load: () => Promise<ConfigDugPluginOutput>;
  reload: () => Promise<ConfigDugPluginOutput | undefined>;
  getNextReloadIn(): number | undefined;
}

export const pluginSchema = z.object({
  isInitialized: z.function().returns(z.boolean()),
  initialize: z.function().returns(z.promise(z.void())),
  load: z.function().returns(z.promise(ConfigDugPluginOutputSchema)),
  reload: z.function().returns(z.promise(ConfigDugPluginOutputSchema)),
  getNextReloadIn: z.function().returns(z.number().optional()),
});

export interface ConfigDugPluginOptions {
  reloadInterval?: string | number;
}

export abstract class BaseConfigDugPlugin<T extends ConfigDugPluginOptions> implements ConfigDugPlugin {
  protected nextReloadAt: number | undefined;
  public initialized: boolean = false;
  protected pluginOptions: T;

  public constructor(options: T) {
    this.pluginOptions = options;

    const nextReloadIn = this.getNextReloadIn();

    this.nextReloadAt = nextReloadIn ? nextReloadIn + Date.now() : undefined;
  }

  /**
   * Initializes the plugin with the provided options and current configuration.
   *
   * @param configDugOptions - The options to configure the plugin.
   * @param currentConfig - The current configuration object, which is read-only.
   * @returns A promise that resolves when the initialization is complete, or void if the initialization is synchronous.
   */
  public async initialize(
    configDugOptions: ConfigDugOptions,
    currentConfig: DeepReadonlyObject<TypedConfig<any>>
  ): Promise<void> {
    this.initialized = true;
  }

  /**
   * Checks if the plugin has been initialized.
   *
   * @returns {boolean} True if the plugin is initialized, otherwise false.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

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

  public async reload(): Promise<ConfigDugPluginOutput | undefined> {
    if (!this.nextReloadAt || this.nextReloadAt > Date.now()) {
      return;
    }

    const loadOutput = await this.load();

    this.nextReloadAt = loadOutput.nextReloadIn ? loadOutput.nextReloadIn + Date.now() : undefined;

    return loadOutput;
  }
}
