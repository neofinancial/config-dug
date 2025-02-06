import { beforeEach, describe, it, vi } from 'vitest';

import { z } from 'zod';

import { ConfigDug } from '../src/config-dug';
import { vstub } from './helpers/vstub';

describe('ConfigDug', () => {
  const testConfigSchema = {
    testNum: z.number().default(0),
  };

  describe('getConfig', () => {
    const configDug = new ConfigDug(testConfigSchema);

    it('should throw an error when attempting to call getConfig without first loading', async () => {
      await expect(async () => configDug.getConfig()).rejects.toThrowError(
        'Config values have not been loaded. You must call `load()` first.'
      );
    });

    it('should successfully return the config object after explicitly loading', async () => {
      await configDug.load();

      const fetchedConfig = configDug.getConfig();

      expect(fetchedConfig).toEqual({ testNum: 0 });
    });
  });

  describe('getRedactedConfig', () => {
    const testRedactedConfigSchema = {
      testNum: z.number().default(0),
      superSecretPassword: {
        schema: z.string().default('password'),
        sensitive: true,
      },
    };

    const configDug = new ConfigDug(testRedactedConfigSchema);

    it('should throw an error when attempting to call getRedactedConfig without first loading', async () => {
      await expect(async () => configDug.getRedactedConfig()).rejects.toThrowError(
        'Config values have not been loaded. You must call `load()` first.'
      );
    });

    it('should successfully return the config object and redact the sensitive fields after explicitly loading', async () => {
      await configDug.load();

      const fetchedConfig = configDug.getRedactedConfig();

      expect(fetchedConfig).toEqual({ testNum: 0, superSecretPassword: '[REDACTED]' });
    });
  });

  describe('config-dug Plugins', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should initialize all plugins', async () => {
      const schema = {};

      const plugins = Array(5)
        .fill(0)
        .map((_) => vstub<ConfigDugPlugin>());

      for (const plugin of plugins) {
        plugin.load.mockResolvedValue({
          values: {},
          valueOrigins: {},
        });
        plugin.isInitialized.mockReturnValue(false);
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

      const plugins = Array(5)
        .fill(0)
        .map((_) => vstub<ConfigDugPlugin>());

      for (const plugin of plugins) {
        plugin.load.mockResolvedValue({
          values: {},
          valueOrigins: {},
        });
        plugin.isInitialized.mockReturnValue(true);
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
        aVariableName2: {
          schema: z.string(),
          description: 'camelCase2',
        },
        aVariableName3: {
          schema: z.string(),
          description: 'camelCase3',
        },
      };

      const plugins = Array(3)
        .fill(0)
        .map((_) => vstub<ConfigDugPlugin>());

      for (const plugin of plugins) {
        plugin.isInitialized.mockReturnValue(true);
      }

      plugins[0].load.mockResolvedValue({
        values: {
          aVariableName: 'value1',
        },
        valueOrigins: {},
      });
      plugins[1].load.mockResolvedValue({
        values: {
          a_variable_name2: 'value2',
        },
        valueOrigins: {},
      });
      plugins[2].load.mockResolvedValue({
        values: {
          'a-variable-name3': 'value3',
        },
        valueOrigins: {},
      });

      const configDug = new ConfigDug(schema, {
        plugins,
        printConfig: true,
      });

      await configDug.load();

      const config = configDug.getConfig();

      expect(config.aVariableName).toEqual('value1');
      expect(config.aVariableName2).toEqual('value2');
      expect(config.aVariableName3).toEqual('value3');
    });
  });
});
