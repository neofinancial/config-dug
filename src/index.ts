/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable unicorn/no-nested-ternary */
/* eslint-disable unicorn/prefer-logical-operator-over-ternary */
/* eslint-disable curly */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import createDebug from 'debug';

import getSecret from './get-secret';
import { validateConfig } from './validate-config';

const debug = createDebug('config-dug');

type ConfigPrimitive = string | number | boolean;
type ConfigValue = ConfigPrimitive | ConfigPrimitive[] | ConfigObject | ConfigObject[];

export interface ConfigObject {
  [key: string]: ConfigValue;
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
  [key: string]: unknown;
}

const resolveFile = (appDirectory: string, configPath: string, fileName: string): string => {
  if (fs.existsSync(path.resolve(appDirectory, configPath, `${fileName}.ts`))) {
    debug(
      'resolved config file',
      fileName,
      path.resolve(appDirectory, configPath, `${fileName}.ts`),
    );

    return path.resolve(appDirectory, configPath, `${fileName}.ts`);
  } else if (fs.existsSync(path.resolve(appDirectory, configPath, `${fileName}.js`))) {
    debug(
      'resolved config file',
      fileName,
      path.resolve(appDirectory, configPath, `${fileName}.js`),
    );

    return path.resolve(appDirectory, configPath, `${fileName}.js`);
  } else {
    debug('unable to resolve config file', fileName);

    return '';
  }
};

const loadFile = (filePath: string): Record<string, unknown> => {
  if (filePath) {
    debug('loading config file', filePath);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config = require(filePath);

      if (/config.+local/.test(filePath)) {
        const fileName = filePath.split('/').pop();

        console.log(`WARNING: Found a local config file ${fileName}`);
      }

      return config.default ? config.default : config;
    } catch (error) {
      console.error(`ERROR: Unable to load config file: ${filePath}`);
      console.error(error);
    }
  }

  return {};
};

const unwrapValue = (value: ConfigValue): ConfigValue => {
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (/^\d+\.\d+$/.test(value)) return Number.parseFloat(value);
    if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => unwrapValue(entry)) as ConfigValue;
  }

  if (typeof value === 'object') {
    const thing = Object.entries(value).reduce((result: ConfigObject, [key, entry]) => {
      result[key] = unwrapValue(entry);

      return result;
    }, {});

    return thing;
  }

  return value;
};

const convertToArray = (value: string): string[] => {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => !!entry);
};

const loadSecrets = (config: LoadSecretsArgs, overrides: LoadSecretsArgs): ConfigValue => {
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
    convertToArray(secretNames).forEach((secretName) => {
      mergedSecretNames.add(secretName);
    });
  }

  const secrets = [...mergedSecretNames].map((name) => {
    debug('loading config from AWS Secrets Manager', name, region);

    return getSecret(name, region, timeout);
  });

  const mergedSecrets: ConfigValue = {};

  secrets.forEach((secret) => {
    Object.assign(mergedSecrets, secret);
  });

  return unwrapValue(mergedSecrets);
};

const loadEnvironment = (): Record<string, unknown> => {
  debug('loading config from environment variables');

  // eslint-disable-next-line unicorn/no-reduce
  return Object.entries(process.env).reduce((result: ConfigObject, [key, value]): ConfigObject => {
    if (value) {
      result[key] = unwrapValue(value);
    }

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
    resolveFile(appDirectory, configPath, `config.${environment}`),
  );
  const localEnvironmentConfig = loadFile(
    resolveFile(appDirectory, configPath, `config.${environment}.local`),
  );
  const localConfig = loadFile(resolveFile(appDirectory, configPath, 'config.local'));
  const fileConfig = Object.assign(
    {},
    defaultConfig,
    environmentConfig,
    localEnvironmentConfig,
    localConfig,
  );

  const environmentVars = loadEnvironment();

  const config = Object.assign(
    {},
    fileConfig,
    loadSecrets(fileConfig, environmentVars),
    environmentVars,
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
