import { vi, describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ConfigDug } from 'config-dug';
import { AWSSecretsManagerPlugin } from '../src/index';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

vi.mock('@aws-sdk/client-secrets-manager');

describe('AWSSecretsManagerPlugin', () => {
  const mockSecretValue = JSON.stringify({ testKey: 'testValue' });

  const mockSecretsManagerClient = {
    send: vi.fn().mockResolvedValue({ SecretString: mockSecretValue }),
  };

  const testPluginOptions = {
    secrets: [
      {
        name: 'testSecret',
        region: 'us-east-1',
      },
    ],
  };

  let plugin: AWSSecretsManagerPlugin;

  beforeEach(() => {
    (SecretsManagerClient as jest.Mock).mockImplementation(() => mockSecretsManagerClient);
    plugin = new AWSSecretsManagerPlugin(testPluginOptions);
  });

  describe('initialize', () => {
    it('should initialize the plugin', async () => {
      await plugin.initialize({});
      expect(plugin['initialized']).toBe(true);
    });
  });

  describe('load', () => {
    it('should load secrets and return values', async () => {
      await plugin.initialize({});
      const output = await plugin.load();
      expect(output.values).toEqual({ testKey: 'testValue' });
    });

    it('should throw an error if load is called before initialize', async () => {
      await expect(plugin.load()).rejects.toThrowError('Plugin not initialized');
    });
  });
});

describe('ConfigDug with AWSSecretsManagerPlugin', () => {
  const testConfigSchema = {
    testKey: z.string().default('defaultValue'),
  };

  const testPluginOptions = {
    secrets: [
      {
        name: 'testSecret',
        region: 'us-east-1',
      },
    ],
  };

  const plugin = new AWSSecretsManagerPlugin(testPluginOptions);
  const configDug = new ConfigDug(testConfigSchema, { plugins: [plugin] });

  it('should load config values from AWS Secrets Manager', async () => {
    const a = await configDug.load();
    console.log('🚀 ~ it ~ a:', a);
    const config = configDug.getConfig();
    expect(config).toEqual({ testKey: 'testValue' });
  });
});
