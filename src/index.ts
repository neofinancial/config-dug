/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import createDebug from 'debug';

import getSecret from './get-secret';

const debug = createDebug('config-dug');

interface ConfigObject {
  [key: string]: string | boolean | number;
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

const loadSecrets = (config: {
  AWS_SECRETS_MANAGER_NAME?: string;
  AWS_SECRETS_MANAGER_REGION?: string;
  AWS_SECRETS_MANAGER_TIMEOUT?: number;
  awsSecretsManagerName?: string;
  awsSecretsManagerRegion?: string;
  awsSecretsManagerTimeout?: number;
}): object => {
  const secretName = config.AWS_SECRETS_MANAGER_NAME || config.awsSecretsManagerName;
  const region = config.AWS_SECRETS_MANAGER_REGION || config.awsSecretsManagerRegion || 'us-east-1';
  const timeout = config.AWS_SECRETS_MANAGER_TIMEOUT || config.awsSecretsManagerTimeout || 5000;

  if (secretName) {
    debug('loading config from AWS Secrets Manager', secretName, region);

    const secret = getSecret(secretName, region, timeout);

    return Object.entries(secret).reduce((result: ConfigObject, [key, value]): ConfigObject => {
      result[key] = convertString(value);

      return result;
    }, {});
  } else {
    return {};
  }
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
  const environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

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
  const config = Object.assign({}, fileConfig, loadSecrets(fileConfig), loadEnvironment());

  return config;
};

const init = (): ConfigObject => {
  debug('loading default config');
  const config = loadConfig();

  return config;
};

export default init();
export { loadConfig };
