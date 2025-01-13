import EventEmitter from 'events';
import createDebug from 'debug';
import { z } from 'zod';
import * as changeKeys from './lib/change-case-keys';

import { ConfigDugOptions, ConfigDugOptionsWithDefaults, getOptions } from './lib/options.js';
import { mergeOrigins, recordOrigin, recordOriginDefaults } from './lib/origins.js';
import { logger } from './lib/logger.js';
import { ConfigDugError } from './lib/errors.js';
import { loadConfigFile } from './lib/config-file.js';
import { getEnvironmentName, loadEnvironment } from './lib/environment.js';
import { parseConfig } from './lib/parser.js';
import { redactConfig } from './lib/redactor.js';
import { printConfig } from './lib/pretty-printer.js';

import type { ConfigDugPluginOutput } from './lib/plugin.js';

const debug = createDebug('config-dug');

type primitive = string | number | boolean | undefined | null;

export type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;
export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
export type DeepReadonly<T> = T extends primitive
  ? T
  : T extends Array<infer U>
  ? DeepReadonlyArray<U>
  : DeepReadonlyObject<T>;

export type UntypedConfig = Record<string, unknown>;
export type ValueOrigins = Record<string, string[]>;
export type ConfigDugSchema = Record<string, BasicSchema | ExtendedSchema>;
export type BasicSchema<TOut = any, TIn = any> = z.ZodType<TOut, z.ZodTypeDef, TIn>;
export type ExtendedSchema<TSchema extends BasicSchema = BasicSchema<unknown, unknown>> = TSchema extends BasicSchema
  ? {
      schema: TSchema;
      description?: string;
      sensitive?: boolean;
      redactorFn?: (value: any) => string;
    }
  : never;
export type TypedConfig<T extends ConfigDugSchema> = T extends any
  ? {
      [K in keyof T]: T[K] extends BasicSchema<infer TOut>
        ? TOut
        : T[K] extends ExtendedSchema
        ? T[K]['schema'] extends BasicSchema<infer TOut>
          ? TOut
          : never
        : never;
    }
  : never;

export type ConfigDugUnsealedConfig<T extends ConfigDugSchema> = Partial<TypedConfig<T>>;
export type ConfigDugConfig<T extends ConfigDugSchema> = DeepReadonlyObject<TypedConfig<T>>;

class ConfigDug<T extends ConfigDugSchema> extends EventEmitter {
  private static instance: any; // TODO: figure out how to properly type this with the generic type input

  private schema: T;
  private options: ConfigDugOptionsWithDefaults;
  private rawValues: UntypedConfig = {};
  private validatedValues: ConfigDugConfig<T> | undefined;
  private valueOrigins: ValueOrigins = {};
  private reloadTimeout?: NodeJS.Timeout;
  private pluginsInitialized = false;
  private loaded = false;

  constructor(schema: T, options?: ConfigDugOptions) {
    super();

    this.schema = schema;
    this.options = getOptions(options || {});
  }

  public static async getConfig<T extends ConfigDugSchema>(
    schema: T,
    options?: ConfigDugOptions
  ): Promise<ConfigDugConfig<T>> {
    if (!ConfigDug.instance) {
      ConfigDug.instance = new ConfigDug<T>(schema, options);

      await ConfigDug.instance.load();
    }

    return ConfigDug.instance.getConfig();
  }

  /**
   * Returns the parsed config values as a strongly-typed object
   *
   * @returns ConfigDugConfig<T>
   */
  public getConfig(): ConfigDugConfig<T> {
    if (!this.validatedValues) {
      throw this.notLoadedError();
    }

    return this.validatedValues;
  }

  /**
   * Returns the parsed config values as a strongly-typed object with any sensitive values redacted
   *
   * @returns ConfigDugConfig<T>
   *
   * @throws {@link Error}
   * Throw if the config has not been loaded yet
   */
  public getRedactedConfig(): ConfigDugConfig<T> {
    if (!this.validatedValues) {
      throw this.notLoadedError();
    }

    return redactConfig(this.schema, this.validatedValues);
  }

  /**
   * Loads the config from config files, environment variables and any specified plugins
   *
   * @returns Promise<void>
   */
  public async load(): Promise<void> {
    debug('loading config');

    if (this.loaded === true) {
      debug('config already loaded');

      return;
    }

    await this.loadConfig();

    this.emit('config-loaded', this.validatedValues);
  }

  /**
   * Force reloads the config from config files, environment variables and any specified plugins
   *
   * @returns Promise<void>
   */
  public async reload(): Promise<void> {
    debug('reloading config');

    await this.loadConfig();

    this.emit('config-reloaded', this.validatedValues);
  }

  private async loadConfig(): Promise<void> {
    const environmentName = getEnvironmentName(this.options.envKey);
    const environmentVariables = this.loadEnvironment(Object.keys(this.schema));

    this.valueOrigins = {};
    this.rawValues = {
      ...(await this.loadConfigFile('config.default')),
      ...(await this.loadConfigFile(`config.${environmentName}`)),
      ...(await this.loadPlugins(environmentVariables)),
      ...(await this.loadLocalConfigFile(`config.${environmentName}.local`)),
      ...(await this.loadLocalConfigFile('config.local')),
      ...this.loadEnvironment(Object.keys(this.schema)),
    };

    debug('load raw values', this.rawValues);

    const [validatedValues, defaults] = parseConfig(this.schema, this.rawValues, this.options.strict);

    this.validatedValues = validatedValues;
    this.valueOrigins = recordOriginDefaults(this.valueOrigins, defaults, 'default');

    if (this.options.printConfig) {
      printConfig(this.getRedactedConfig(), this.valueOrigins);
    }

    debug('load validated values', this.validatedValues);

    this.loaded = true;
  }

  private async loadConfigFile(filename: string): Promise<UntypedConfig> {
    if (this.options.loadConfigFiles) {
      debug('load config file', filename);
    } else {
      debug('load config file disabled', filename);

      return {};
    }

    const [resolvedFilename, values] = await loadConfigFile(filename, this.options.basePath, ['js', 'cjs', 'mjs']);
    const keyCorrectedValues = changeKeys[this.options.keyStyle](values);

    if (resolvedFilename) {
      this.valueOrigins = recordOrigin(this.valueOrigins, keyCorrectedValues, resolvedFilename);
    }

    return keyCorrectedValues;
  }

  private async loadLocalConfigFile(filename: string): Promise<UntypedConfig> {
    if (this.options.loadConfigFiles) {
      debug('load local config file', filename);
    } else {
      debug('load local config file disabled', filename);

      return {};
    }

    const [resolvedFilename, values] = await loadConfigFile(filename, this.options.basePath, ['js', 'cjs', 'mjs']);
    const keyCorrectedValues = changeKeys[this.options.keyStyle](values);

    if (resolvedFilename) {
      this.options.warnOnLocalConfigFile && logger.warn(`Loaded local config file: ${resolvedFilename}`);
      this.valueOrigins = recordOrigin(this.valueOrigins, keyCorrectedValues, resolvedFilename);
    }

    return keyCorrectedValues;
  }

  private loadEnvironment(keys: string[]): UntypedConfig {
    if (this.options.loadEnvironment) {
      debug('load environment', keys);
    } else {
      debug('load environment disabled', keys);

      return {};
    }

    const values = loadEnvironment(keys);
    this.valueOrigins = recordOrigin(this.valueOrigins, values, 'environment');

    return values;
  }

  private async loadPlugins(values: UntypedConfig): Promise<UntypedConfig> {
    let nextPluginReloadIn: number | undefined;

    for (const plugin of this.options.plugins) {
      if (!plugin.isInitialized()) {
        await plugin.initialize(this.options, values);
      }

      const pluginReturnValue: ConfigDugPluginOutput = await plugin.load();
      const keyCorrectedValues = changeKeys[this.options.keyStyle](pluginReturnValue.values);
      values = { ...values, ...keyCorrectedValues };
      this.valueOrigins = mergeOrigins(this.valueOrigins, pluginReturnValue.valueOrigins);

      if (pluginReturnValue.nextReloadIn) {
        // We will reload in time for the nearest plugin reload
        nextPluginReloadIn = nextPluginReloadIn
          ? Math.min(nextPluginReloadIn, pluginReturnValue.nextReloadIn)
          : pluginReturnValue.nextReloadIn;
      }
    }

    if (nextPluginReloadIn) {
      this.reloadTimeout = setTimeout(async () => {
        await this.reload();
      }, nextPluginReloadIn);
    }

    debug('plugin values', values);

    return values;
  }

  private notLoadedError(): Error {
    return new ConfigDugError('Config values have not been loaded. You must call `load()` first.');
  }
}

export { ConfigDug };
