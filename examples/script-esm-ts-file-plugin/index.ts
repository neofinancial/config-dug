import { ConfigDug, z } from 'config-dug';
import { FilePlugin } from '@config-dug/plugin-file';

const schema = {
  apiKey: {
    schema: z.string(),
    description: 'The API key',
    sensitive: true,
  },
  logLevel: z.string().default('info'),
};

const filePlugin = new FilePlugin({
  files: ['config.json'],
});

const config = await ConfigDug.getConfig(schema, { plugins: [filePlugin], printConfig: true });

console.log('logLevel', config.logLevel);
