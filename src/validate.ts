/* eslint-disable no-console */
import { ConfigObject } from '.';

const validate = (config: ConfigObject): ConfigObject => {
  Object.keys(config).forEach(key => {
    if (config[key] === undefined) {
      console.warn(`WARNING: Found undefined config value for ${key}`);
    }
  });

  return config;
};

export default validate;
