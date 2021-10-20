/* eslint-disable no-console */
import { ConfigObject } from '.';

const hasTrailingOrLeadingWhitespace = (value: string): boolean => {
  const trailingOrLeadingWhiteSpace = new RegExp('^[ \\s]+|[ \\s]+$');

  return trailingOrLeadingWhiteSpace.test(value);
};

const validateConfig = (config: ConfigObject): ConfigObject => {
  Object.keys(config).forEach((key) => {
    const value = config[key];

    if (value === undefined || value === null || value === 'undefined' || value === '') {
      console.log(`WARNING: Found undefined config value for ${key}`);
    }

    if (typeof value === 'string' && hasTrailingOrLeadingWhitespace(value)) {
      console.log(
        `WARNING: Found leading and/or trailing whitespace within config value for ${key}`
      );
    }
  });

  return config;
};

export { validateConfig, hasTrailingOrLeadingWhitespace };
