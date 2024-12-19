import { ConfigDugPlugin, ConfigDugOptions, ConfigDugPluginOutput } from 'config-dug';
import { SSMClient, GetParametersByPathCommand, GetParametersByPathCommandOutput } from '@aws-sdk/client-ssm';
import createDebug from 'debug';
import ms from 'ms';
import { camelCase } from 'change-case';

export interface AWSParamStorePluginPathOptions {
  path: string;
  region: string;
  reloadInterval?: string | number;
}

export interface AWSParamStorePluginOptions {
  paths: AWSParamStorePluginPathOptions[];
  keyTransformer?: (key: string) => string;
  keyStyle?: 'camelCase';
}

interface AWSParamStorePluginPath {
  client: SSMClient;
  getParametersByPathCommand: GetParametersByPathCommand;
  getParametersByPathCommandOutput?: GetParametersByPathCommandOutput;
  config: AWSParamStorePluginPathOptions;
  nextReloadAt?: number;
  isLoaded?: boolean;
}

const debug = createDebug('config-dug:plugin:aws-param-store');

class AWSParamStorePlugin implements ConfigDugPlugin {
  private paths: AWSParamStorePluginPath[] = [];
  private pluginOptions: AWSParamStorePluginOptions;
  // private configDugOptions: ConfigDugOptions = {};
  private valueOrigins: Record<string, string[]> = {};
  private initialized: boolean = false;

  constructor(options: AWSParamStorePluginOptions) {
    this.pluginOptions = options;
  }

  public initialize = async (configDugOptions: ConfigDugOptions): Promise<void> => {
    // this.configDugOptions = configDugOptions;
    this.paths = this.createPaths();

    this.initialized = true;
  };

  public load = async (): Promise<ConfigDugPluginOutput> => {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }

    this.valueOrigins = {};
    let values: Record<string, unknown> = {};
    let nextReloadIn: number | undefined;

    for (const path of this.paths) {
      if (!path.isLoaded) {
        debug('initial load of path', path.config.path);
        path.getParametersByPathCommandOutput = await path.client.send(path.getParametersByPathCommand);
        path.isLoaded = true;

        if (path.config.reloadInterval) {
          nextReloadIn = this.getNextReloadInterval(path);
        }
      } else if (path.nextReloadAt && path.nextReloadAt < Date.now()) {
        debug('refreshing path', `${path.config.region}:${path.config.path}`);
        path.getParametersByPathCommandOutput = await path.client.send(path.getParametersByPathCommand);

        nextReloadIn = this.getNextReloadInterval(path, nextReloadIn);
      }

      if (path.getParametersByPathCommandOutput?.Parameters?.length) {
        console.log(path.getParametersByPathCommandOutput.Parameters);

        const newValues: Record<string, unknown> = {};

        for (const parameter of path.getParametersByPathCommandOutput.Parameters) {
          if (parameter.Name) {
            const keyMatches = parameter.Name.match(/\/(?:.*\/)?(.+)$/);

            console.log(keyMatches);

            if (keyMatches && keyMatches.length === 2) {
              if (this.pluginOptions.keyStyle === 'camelCase') {
                newValues[camelCase(keyMatches[1])] = parameter.Value;
              } else {
                newValues[keyMatches[1]] = parameter.Value;
              }
            } else {
              console.log('cant extract key from path');
            }
          } else {
            console.log('parameter has no name');
          }
        }

        console.log('NEW_VALUES', newValues);

        values = { ...values, ...newValues };

        this.recordValueOrigins(newValues, `${path.config.region}:${path.config.path}`);

        // try {
        //   const newValues = JSON.parse(pathString);

        //   values = { ...values, ...newValues };

        //   this.recordValueOrigins(newValues, `${path.config.region}:${path.config.path}`);
        // } catch (error) {
        //   // warn that path is not valid JSON?
        // }
      } else {
        // warn that path is empty?
      }
    }

    debug('plugin values', values);
    debug('plugin value origins', this.valueOrigins);
    debug('plugin reload in', nextReloadIn);

    return {
      values,
      valueOrigins: this.valueOrigins,
      nextReloadIn,
    };
  };

  private createPaths = (): AWSParamStorePluginPath[] => {
    return this.pluginOptions.paths.map((path) => {
      return {
        client: new SSMClient({
          region: path.region,
        }),
        getParametersByPathCommand: new GetParametersByPathCommand({
          Path: path.path,
        }),
        config: path,
      };
    });
  };

  private recordValueOrigins = (values: Record<string, unknown>, origin: string) => {
    for (const key of Object.keys(values)) {
      if (this.valueOrigins[key]) {
        const last = this.valueOrigins[key][this.valueOrigins[key].length - 1];

        if (last !== origin) {
          this.valueOrigins[key] = [...this.valueOrigins[key], origin];
        }
      } else {
        this.valueOrigins[key] = [origin];
      }
    }
  };

  private getNextReloadInterval(path: AWSParamStorePluginPath, currentNextReloadIn?: number): number | undefined {
    if (typeof path.config.reloadInterval === 'string') {
      const reloadIn = ms(path.config.reloadInterval);

      path.nextReloadAt = reloadIn + Date.now();

      if (currentNextReloadIn) {
        return reloadIn < currentNextReloadIn ? reloadIn : currentNextReloadIn;
      } else {
        return reloadIn;
      }
    } else if (typeof path.config.reloadInterval === 'number') {
      path.nextReloadAt = path.config.reloadInterval + Date.now();

      if (currentNextReloadIn) {
        return path.nextReloadAt < currentNextReloadIn ? path.nextReloadAt : currentNextReloadIn;
      } else {
        return path.nextReloadAt;
      }
    }
  }
}

export { AWSParamStorePlugin };
