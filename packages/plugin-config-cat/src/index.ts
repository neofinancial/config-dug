import { BaseConfigDugPlugin, ConfigDugPluginOptions, ConfigDugPluginOutput } from 'config-dug';
import { z } from 'zod';

import createDebug from 'debug';
import { getClient, IConfigCatClient, IManualPollOptions } from 'configcat-node';

import { DeepReadonlyObject, TypedConfig } from 'config-dug/config-dug';

export const targetedConfigCatFlagSchema = z
  .function()
  .args(
    z.object({
      identifier: z.string(),
      email: z.string().optional(),
      country: z.string().optional(),
      custom: z.record(z.string(), z.string() || z.number()).optional(),
    }),
  )
  .returns(z.promise(z.union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])));

type ConfigCatValueType = string | number | boolean | null | undefined;
interface ConfigCatTargetUser {
  /** The unique identifier of the user or session (e.g. email address, primary key, session ID, etc.) */
  identifier: string;
  /** Email address of the user. */
  email?: string | undefined;
  /** Country of the user. */
  country?: string | undefined;
  /**
   * Custom attributes of the user for advanced targeting rule definitions (e.g. user role, subscription type, etc.)
   * @remarks
   * @link https://configcat.com/docs/targeting/targeting-rule/user-condition/
   **/
  custom: {
    [key: string]: string | number | Date | ReadonlyArray<string>;
  };
}

enum PollingMode {
  /** The ConfigCat SDK downloads the latest values automatically and stores them in the local cache. */
  AutoPoll = 0,
  /** The ConfigCat SDK downloads the latest setting values only if they are not present in the local cache, or if the cache entry has expired. */
  LazyLoad = 1,
  /** The ConfigCat SDK will not download the config JSON automatically. You need to update the cache manually, by calling `forceRefresh()`. */
  ManualPoll = 2,
}

export interface ConfigCatPluginOptions extends ConfigDugPluginOptions {
  configCatOptions?: IManualPollOptions;
  sdkKeyName: string;
  sourceKeyStyle?: string;
  targetedFlags?: ConfigCatTargetedFlag[];
}

interface ConfigCatTargetedFlag {
  key: string;
  defaultValue: ConfigCatValueType;
}

const debug = createDebug('config-dug:plugin:config-cat');

class ConfigCatPlugin extends BaseConfigDugPlugin<ConfigCatPluginOptions> {
  private valueOrigins: Record<string, string[]> = {};
  private client?: IConfigCatClient;

  public override async initialize(currentConfig: DeepReadonlyObject<TypedConfig<any>>): Promise<void> {
    const sdkKey = currentConfig[this.pluginOptions.sdkKeyName] as string | undefined;

    if (!sdkKey) {
      throw new Error(
        `Config value: ${this.pluginOptions.sdkKeyName} is required to be configured before loading this plugin.`,
      );
    }

    this.client = getClient(sdkKey, PollingMode.ManualPoll, this.pluginOptions.configCatOptions);
    this.initialized = true;
  }

  public async load(): Promise<ConfigDugPluginOutput> {
    if (!this.initialized || !this.client) {
      throw new Error('Plugin not initialized');
    }

    const values: Record<string, unknown> = {};

    // All feature flag values will be loaded including targeted flags using an undefined target
    const configs = await this.client.getAllValuesAsync();

    for (const config of configs) {
      values[config.settingKey] = config.settingValue;
    }

    // We will overwrite all targeted flag values with the targeted flag callback function
    for (const targetedFlag of this.pluginOptions.targetedFlags ?? []) {
      values[targetedFlag.key] = this.getTargetedFlagCallback(targetedFlag.key, targetedFlag.defaultValue);
    }

    this.recordValueOrigins(values, 'config-cat');
    const nextReloadIn = this.getNextReloadIn();

    debug('plugin values', values);
    debug('plugin value origins', this.valueOrigins);
    debug('plugin reload in', nextReloadIn);

    return {
      values,
      valueOrigins: this.valueOrigins,
      nextReloadIn: nextReloadIn,
    };
  }

  private getTargetedFlagCallback(key: string, defaultValue: ConfigCatValueType) {
    return async (user: ConfigCatTargetUser): Promise<ConfigCatValueType> => {
      if (!this.client) {
        throw new Error('Plugin not initialized');
      }

      const value = await this.client.getValueAsync<ConfigCatValueType>(key, defaultValue, user);

      return value;
    };
  }

  private recordValueOrigins(values: Record<string, unknown>, origin: string): void {
    for (const key of Object.keys(values)) {
      if (this.valueOrigins[key]) {
        const last = this.valueOrigins[key].at(-1);

        if (last !== origin) {
          this.valueOrigins[key] = [...this.valueOrigins[key], origin];
        }
      } else {
        this.valueOrigins[key] = [origin];
      }
    }
  }
}

export { ConfigCatPlugin };
