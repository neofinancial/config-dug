import { ConfigDug, z } from 'config-dug';
import { AWSParamStorePlugin } from '@config-dug/plugin-aws-param-store';
// import { AWSSecretsManagerPlugin } from '@config-dug/plugin-aws-secrets-manager';

const schema = {
  logLevel: z.string().default('info'),
  tracingEnabled: z.boolean().default(false),
  apiToken: {
    schema: z.string(),
    sensitive: true,
    alternateKeys: ['api-token', 'API_TOKEN'],
  },
};

// const awsSecretsManagerPlugin = new AWSSecretsManagerPlugin({
//   secrets: [
//     {
//       name: 'config-dug-test/config',
//       region: 'ca-central-1',
//       reloadInterval: '1m',
//     },
//   ],
// });

const awsParamStorePlugin = new AWSParamStorePlugin({
  paths: [
    {
      path: '/config-dug-test/config',
      region: 'ca-central-1',
      reloadInterval: '1m',
    },
  ],
  sourceKeyStyle: 'kebab-case',
});

const configDug = new ConfigDug(schema, {
  plugins: [awsParamStorePlugin],
  printConfig: true,
  outputKeyStyle: 'camelCase',
});

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
