import { z } from 'zod';
import { ConfigDug } from '../src/config-dug';

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
});
