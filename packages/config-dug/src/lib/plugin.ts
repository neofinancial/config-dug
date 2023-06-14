import { ConfigDugSchema, UntypedConfig, ValueOrigins } from '../config-dug.js';
import { ConfigDugOptions } from './options.js';

export type ConfigDugPluginOutput = {
  schema?: ConfigDugSchema;
  values: UntypedConfig;
  valueOrigins: ValueOrigins;
  nextReloadIn?: number;
};

export interface ConfigDugPlugin {
  initialize?: (configDugOptions: ConfigDugOptions) => Promise<void>;
  load?: () => Promise<ConfigDugPluginOutput>;
}
