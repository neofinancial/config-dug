const { ConfigDug, z } = require('config-dug');

const schema = {
  logLevel: z.string().default('info'),
};

(async () => {
  const config = await ConfigDug.getConfig(schema);

  console.log('logLevel', config.logLevel);
})();
