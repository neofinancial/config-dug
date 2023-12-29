import { ConfigDug, z } from 'config-dug';

const schema = {
  logLevel: z.string().default('info'),
};

const config = await ConfigDug.getConfig(schema);

console.log('logLevel', config.logLevel);
