import { ConfigDug, z } from 'config-dug';
import { AWSSecretsManagerPlugin } from '@config-dug/plugin-aws-secrets-manager';

const schema = {
  logLevel: z.string().default('info'),
  API_TOKEN: z.string(),
};

const awsSecretsManagerPlugin = new AWSSecretsManagerPlugin({
  secrets: [
    {
      name: 'config-dug-test/config',
      region: 'ca-central-1',
      reloadInterval: '1m',
    },
  ],
});

const configDug = new ConfigDug(schema, { plugins: [awsSecretsManagerPlugin] });

configDug.on('config-loaded', (config) => {
  console.log('config-loaded event received', config);
});

configDug.on('config-reloaded', (config) => {
  console.log('config-reloaded event received', config);
});

await configDug.load();

const getConfig = () => {
  return configDug.getConfig();
};

export { getConfig };
