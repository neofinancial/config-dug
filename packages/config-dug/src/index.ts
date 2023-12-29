export { z } from 'zod';

export { ConfigDug, ConfigDugSchema, ConfigDugConfig, UntypedConfig, ValueOrigins } from './config-dug.js';
export { ConfigDugError } from './lib/errors.js';
export type { ConfigDugPlugin, ConfigDugPluginOutput } from './lib/plugin.js';
export type { ConfigDugOptions } from './lib/options.js';
