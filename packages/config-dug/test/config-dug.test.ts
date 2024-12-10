import { beforeEach, describe, it, vi } from 'vitest';

import { z } from 'zod';

import { createMockPlugin } from './helpers/plugin.helpers';
import { ConfigDug } from '../src/config-dug';

describe('config-dug Plugins', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize all plugins', async () => {
    const schema = {};

    const plugins = Array.from({ length: 5 }).fill(createMockPlugin());

    for (const plugin of plugins) {
      plugin.load.mockResolvedValue({
        values: {},
        valueOrigins: {},
      });
    }

    const configDug = new ConfigDug(schema, {
      plugins,
      printConfig: true,
    });

    await configDug.load();

    for (const plugin of plugins) {
      expect(plugin.initialize).toHaveBeenCalled();
    }
  });

  it('should load all plugins', async () => {
    const schema = {};

    const plugins = Array.from({ length: 5 }).fill(createMockPlugin());

    for (const plugin of plugins) {
      plugin.load.mockResolvedValue({
        values: {},
        valueOrigins: {},
      });
    }

    const configDug = new ConfigDug(schema, {
      plugins,
      printConfig: true,
    });

    await configDug.load();

    for (const plugin of plugins) {
      expect(plugin.load).toHaveBeenCalled();
    }
  });

  it('should coerce the plugin value names correctly', async () => {
    const schema = {
      aVariableName: {
        schema: z.string(),
        description: 'camelCase',
      },
      a_variable_name: {
        schema: z.string(),
        description: 'snakeCase',
      },
      A_VARIABLE_NAME: {
        schema: z.string(),
        description: 'constantCase',
      },
    };

    const plugins = Array.from({ length: 3 }).fill(createMockPlugin());

    for (const plugin of plugins) {
      plugin.load.mockResolvedValue({
        values: {
          aVariableName: 'value',
        },
        valueOrigins: {},
      });
    }

    plugins[0].getPluginKeyStyle.mockReturnValueOnce('camelCase');
    plugins[1].getPluginKeyStyle.mockReturnValueOnce('constantCase');
    plugins[2].getPluginKeyStyle.mockReturnValueOnce('snakeCase');

    const configDug = new ConfigDug(schema, {
      plugins,
      printConfig: true,
    });

    await configDug.load();

    const config = configDug.getConfig();

    expect(config.aVariableName).toEqual('value');
    expect(config.a_variable_name).toEqual('value');
    expect(config.A_VARIABLE_NAME).toEqual('value');
  });
});
