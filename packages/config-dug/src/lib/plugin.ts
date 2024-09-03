import { ConfigDugSchema, UntypedConfig, ValueOrigins } from '../config-dug.js';
import { ConfigDugOptionsWithDefaults } from './options.js';

export type ConfigDugPluginOutput = {
  schema?: ConfigDugSchema;
  values: UntypedConfig;
  valueOrigins: ValueOrigins;
  nextReloadIn?: number;
};

export interface ConfigDugPlugin {
  initialize?: (configDugOptions: ConfigDugOptionsWithDefaults) => Promise<void>;
  load?: () => Promise<ConfigDugPluginOutput>;
}
