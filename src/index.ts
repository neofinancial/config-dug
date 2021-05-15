/* eslint-disable unicorn/no-nested-ternary */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import createDebug from 'debug';

import getSecret from './get-secret';
import { validateConfig } from './validate-config';

const debug = createDebug('config-dug');

export interface ConfigObject {
  [key: string]: string | boolean | number;
}

interface LoadSecretsArgs {
  AWS_SECRETS_MANAGER_NAME?: string;
  AWS_SECRETS_MANAGER_NAMES?: string;
  AWS_SECRETS_MANAGER_REGION?: string;
  AWS_SECRETS_MANAGER_TIMEOUT?: number;
  awsSecretsManagerName?: string;
  awsSecretsManagerNames?: string;
  awsSecretsManagerRegion?: string;
  awsSecretsManagerTimeout?: number;
}

export interface SecretObject {
  [key: string]: string;
}

const resolveFile = (appDirectory: string, configPath: string, fileName: string): string => {
  if (fs.existsSync(path.resolve(appDirectory, configPath, `${fileName}.ts`))) {
    debug(
      'resolved config file',
      fileName,
      path.resolve(appDirectory, configPath, `${fileName}.ts`)
    );

    return path.resolve(appDirectory, configPath, `${fileName}.ts`);
  } else if (fs.existsSync(path.resolve(appDirectory, configPath, `${fileName}.js`))) {
    debug(
      'resolved config file',
      fileName,
      path.resolve(appDirectory, configPath, `${fileName}.js`)
    );

    return path.resolve(appDirectory, configPath, `${fileName}.js`);
  } else {
    debug('unable to resolve config file', fileName);

    return undefined;
  }
};

const loadFile = (filePath: string): object => {
  if (filePath) {
    debug('loading config file', filePath);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config = require(filePath);

      return config.default ? config.default : config;
    } catch (error) {
      console.error(`ERROR: Unable to load config file: ${filePath}`);
      console.error(error);
    }
  }
};

const convertString = (value: string): string | number | boolean => {
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (value.match(/^\d+\.\d+$/)) return parseFloat(value);
  if (value.match(/^\d+$/)) return parseInt(value, 10);

  return value;
};

const convertToArray = (value: string): string[] => {
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => !!entry);
};

const loadSecrets = (config: LoadSecretsArgs, overrides: LoadSecretsArgs): object => {
  const secretNames =
    overrides.AWS_SECRETS_MANAGER_NAMES ||
    config.AWS_SECRETS_MANAGER_NAMES ||
    config.awsSecretsManagerNames;

  const secretName =
    overrides.AWS_SECRETS_MANAGER_NAME ||
    config.AWS_SECRETS_MANAGER_NAME ||
    config.awsSecretsManagerName;

  const region =
    overrides.AWS_SECRETS_MANAGER_REGION ||
    config.AWS_SECRETS_MANAGER_REGION ||
    config.awsSecretsManagerRegion ||
    'us-east-1';

  const timeout =
    overrides.AWS_SECRETS_MANAGER_TIMEOUT ||
    config.AWS_SECRETS_MANAGER_TIMEOUT ||
    config.awsSecretsManagerTimeout ||
    5000;

  const mergedSecretNames = new Set<string>();

  if (secretName) {
    mergedSecretNames.add(secretName);
  }

  if (secretNames) {
    convertToArray(secretNames).forEach(secretName => {
      mergedSecretNames.add(secretName);
    });
  }

  const secrets = [...mergedSecretNames].map(name => {
    debug('loading config from AWS Secrets Manager', name, region);

    return getSecret(name, region, timeout);
  });

  const mergedSecrets: SecretObject = {};

  secrets.forEach(secret => {
    Object.assign(mergedSecrets, secret);
  });

  return Object.entries(mergedSecrets).reduce(
    (result: ConfigObject, [key, value]): ConfigObject => {
      result[key] = convertString(value);

      return result;
    },
    {}
  );
};

const loadEnvironment = (): object => {
  debug('loading config from environment variables');

  return Object.entries(process.env).reduce((result: ConfigObject, [key, value]): ConfigObject => {
    result[key] = convertString(value);

    return result;
  }, {});
};

const loadConfig = (configPath = ''): ConfigObject => {
  const appDirectory = fs.realpathSync(process.cwd());
  const environment = process.env.APP_ENV
    ? process.env.APP_ENV
    : process.env.NODE_ENV
    ? process.env.NODE_ENV
    : 'development';

  debug('loading config from', path.resolve(appDirectory, configPath));

  const defaultConfig = loadFile(resolveFile(appDirectory, configPath, 'config.default'));
  const environmentConfig = loadFile(
    resolveFile(appDirectory, configPath, `config.${environment}`)
  );
  const localEnvironmentConfig = loadFile(
    resolveFile(appDirectory, configPath, `config.${environment}.local`)
  );
  const localConfig = loadFile(resolveFile(appDirectory, configPath, 'config.local'));
  const fileConfig = Object.assign(
    {},
    defaultConfig,
    environmentConfig,
    localEnvironmentConfig,
    localConfig
  );

  const environmentVars = loadEnvironment();

  const config = Object.assign(
    {},
    fileConfig,
    loadSecrets(fileConfig, environmentVars),
    environmentVars
  );

  if (environment === 'test' || environment === 'development') {
    return config;
  } else {
    return validateConfig(config);
  }
};

const init = (): ConfigObject => {
  debug('loading default config');

  const config = loadConfig();

  return config;
};

export default init();
export { loadConfig };
