/* eslint-disable no-console */
import { ConfigObject } from '.';

const validateConfig = (config: ConfigObject): ConfigObject => {
  Object.keys(config).forEach(key => {
    const value = config[key];

    if (value === undefined || value === null || value === 'undefined' || value === '') {
      console.warn(`WARNING: Found undefined config value for ${key}`);
    }
  });

  return config;
};

export default validateConfig;
