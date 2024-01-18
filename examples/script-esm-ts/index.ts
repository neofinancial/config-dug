import { ConfigDug, z } from 'config-dug';

const schema = {
  logLevel: z.string().default('info'),
};

const configDug = new ConfigDug(schema, { reloadInterval: 20000 });

await configDug.load();

console.log('logLevel', configDug.getConfig().logLevel);

configDug.on('config-reloaded', (config) => {
  console.log('\n\nconfig-reloaded event received', config);
});
