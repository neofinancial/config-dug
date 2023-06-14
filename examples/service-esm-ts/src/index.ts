import { getConfig } from './config.js';

setInterval(async () => {
  console.log('config', getConfig());
}, 10_000);
