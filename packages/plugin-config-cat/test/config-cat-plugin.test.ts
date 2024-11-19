import { ConfigDug, z } from '../../config-dug/src';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigCatPlugin, targetedConfigCatFlagSchema } from '../src';

describe('configCatPlugin', () => {
  beforeEach(() => {
    process.env.CONFIG_CAT_SDK_KEY = undefined;
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it('should throw an error if the sdk key is not set', async () => {
    const schema = {};

    const configCatPlugin = new ConfigCatPlugin({
      sdkKeyName: 'CONFIG_CAT_SDK_KEY',
      sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
    });

    const configDug = new ConfigDug(schema, {
      plugins: [configCatPlugin],
      printConfig: true,
    });

    await expect(configDug.load()).rejects.toThrowError(
      'Environment variable CONFIG_CAT_SDK_KEY is required to be configured.'
    );
  });

  it.only('should load config', async () => {
    vi.mock('configcat-node', () => ({
      getClient: () => {
        const getAllValuesAsync = vi.fn();
        const getValueAsync = vi.fn();

        getAllValuesAsync.mockResolvedValue([
          {
            settingKey: 'value1',
            settingValue: true,
          },
          {
            settingKey: 'value2',
            settingValue: 'test value',
          },
        ]);

        return {
          getAllValuesAsync,
          getValueAsync,
        };
      },
    }));

    const schema = {
      CONFIG_CAT_SDK_KEY: z.string(),
      value1: {
        schema: z.boolean(),
        description: 'ConfigCat config boolean',
        sensitive: false,
      },
      value2: {
        schema: z.string(),
        description: 'ConfigCat key',
        sensitive: true,
      },
    };

    const configCatPlugin = new ConfigCatPlugin({
      sdkKeyName: 'CONFIG_CAT_SDK_KEY',
      sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
    });

    process.env.CONFIG_CAT_SDK_KEY = 'some-config-string';

    const configDug = new ConfigDug(schema, {
      plugins: [configCatPlugin],
      printConfig: true,
    });

    await configDug.load();
    const config = configDug.getConfig();

    expect(config.value1).toEqual(true);
    expect(config.value2).toEqual('test value');
  });

  it('should properly overwrite targeted flag functions', async () => {
    vi.mock('configcat-node', () => ({
      getClient: () => {
        const getAllValuesAsync = vi.fn();
        const getValueAsync = vi.fn();

        getAllValuesAsync.mockResolvedValue([]);
        getValueAsync.mockResolvedValueOnce(true);
        getValueAsync.mockResolvedValueOnce('test value');

        return {
          getAllValuesAsync,
          getValueAsync,
        };
      },
    }));

    const schema = {
      CONFIG_CAT_SDK_KEY: z.string(),
      value1: {
        schema: targetedConfigCatFlagSchema,
        description: 'Targeted ConfigCat config boolean',
        sensitive: false,
      },
      value2: {
        schema: targetedConfigCatFlagSchema,
        description: 'Targeted ConfigCat config string',
        sensitive: true,
      },
    };

    const configCatPlugin = new ConfigCatPlugin({
      sdkKeyName: 'CONFIG_CAT_SDK_KEY',
      sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
    });

    process.env.CONFIG_CAT_SDK_KEY = 'some-config-string';

    const configDug = new ConfigDug(schema, {
      plugins: [configCatPlugin],
      printConfig: true,
    });

    await configDug.load();
    const config = configDug.getConfig();

    expect(typeof config.value1).toEqual('function');
    expect(typeof config.value2).toEqual('function');
    await expect(config.value1({ identifier: 'test1' })).resolves.toEqual(true);
    await expect(config.value2({ identifier: 'test2' })).resolves.toEqual('test value');
  });
});
