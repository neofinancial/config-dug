import ms from 'ms';
import { z } from 'zod';

import { ConfigDugSchema, DeepReadonlyObject, TypedConfig, UntypedConfig, ValueOrigins } from '../config-dug.js';

export type ConfigDugPluginOutput = {
  nextReloadIn?: number;
  schema?: ConfigDugSchema;
  values: UntypedConfig;
  valueOrigins: ValueOrigins;
};

export const pluginSchema = z.custom<BaseConfigDugPlugin<ConfigDugPluginOptions>>();

export interface ConfigDugPluginOptions {
  reloadInterval?: string | number;
}

export abstract class BaseConfigDugPlugin<T extends ConfigDugPluginOptions> {
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
  public abstract initialize(currentConfig: DeepReadonlyObject<TypedConfig<any>>): Promise<void>;

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
