import createDebug from 'debug';
import { constantCase } from 'change-case';

import { UntypedConfig } from '../config-dug.js';
import { logger } from './logger.js';

const debug = createDebug('config-dug:environment');

const getEnvironmentName = (envKey: string): string => {
  debug('get environment name from', envKey);

  const environmentName = process.env[envKey];

  if (!environmentName) {
    debug('unable to load environment name, defaulting to `development`');
    logger.warn(`Unable to load environment from ${envKey}. Defaulting to \`development\`.`);

    return 'development';
  } else {
    debug('resolved environment name', environmentName);
    return environmentName;
  }
};

const loadEnvironment = (keys: string[]): UntypedConfig => {
  debug('load environment', keys);

  const keyMap = new Map<string, string>();
  const upperCaseKeys = keys.map((key) => {
    const upperCaseKey = constantCase(key);

    keyMap.set(upperCaseKey, key);

    return upperCaseKey;
  });

  debug('load environment upperCaseKeys', upperCaseKeys);

  const values: UntypedConfig = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (keys.includes(key)) {
      values[key] = value;
    } else if (upperCaseKeys.includes(key)) {
      const originalKey = keyMap.get(key);

      if (originalKey) {
        values[originalKey] = value;
      }
    }
  }

  return values;
};

export { getEnvironmentName, loadEnvironment };
