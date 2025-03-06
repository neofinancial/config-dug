import { ConfigDug } from 'config-dug';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ConfigCatPlugin, targetedConfigCatFlagSchema } from '../src';

const mocks = vi.hoisted(() => {
  const getClient = vi.fn();

  return {
    getClient,
  };
});

vi.mock('configcat-node', () => {
  return {
    getClient: mocks.getClient,
  };
});

describe('configCatPlugin', () => {
  const getAllValuesAsync = vi.fn();
  const getValueAsync = vi.fn();

  beforeEach(() => {
    process.env.CONFIG_CAT_SDK_KEY = undefined;
    vi.restoreAllMocks();
    mocks.getClient.mockReturnValue({
      getAllValuesAsync,
      getValueAsync,
    });
  });

  it('should throw an error if the sdk key is not set', async () => {
    const schema = {};

    const configCatPlugin = new ConfigCatPlugin({
      sdkKeyName: 'CONFIG_CAT_SDK_KEY',
      sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
    });

    console.log(configCatPlugin);

    const configDug = new ConfigDug(schema, {
      plugins: [configCatPlugin],
      printConfig: true,
    });

    await expect(configDug.load()).rejects.toThrowError(
      'Config value: CONFIG_CAT_SDK_KEY is required to be configured before loading this plugin.'
    );
  });

  it('should load config', async () => {
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

    getValueAsync.mockResolvedValueOnce(true);
    getValueAsync.mockResolvedValueOnce('test value');

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
      targetedFlags: [
        {
          key: 'value1',
          defaultValue: false,
        },
        {
          key: 'value2',
          defaultValue: 'test default',
        },
      ],
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
