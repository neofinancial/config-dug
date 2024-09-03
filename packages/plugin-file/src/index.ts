import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigDugPlugin, ConfigDugOptions, ConfigDugPluginOutput } from 'config-dug';
import createDebug from 'debug';
import globby from 'globby';
import ms from 'ms';

export interface FilePluginOptions {
  files: string[];
  reloadInterval?: string | number;
}

const debug = createDebug('config-dug:plugin:file');

// const invariant = <T>(value: T | undefined, message: string): value is never => {
//   if (value === undefined) {
//     throw new Error(message);
//   }

//   return true;
// }

class FilePlugin implements ConfigDugPlugin {
  private pluginOptions: FilePluginOptions;
  private configDugOptions: ConfigDugOptions | undefined;
  private valueOrigins: Record<string, string[]> = {};
  private initialized: boolean = false;

  constructor(options: FilePluginOptions) {
    this.pluginOptions = options;
  }

  public initialize = async (configDugOptions: ConfigDugOptions): Promise<void> => {
    this.configDugOptions = configDugOptions;
    this.initialized = true;
  };

  public load = async (): Promise<ConfigDugPluginOutput> => {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }

    if (this.configDugOptions === undefined) {
      throw new Error('ConfigDugOptions not set');
    }

    this.valueOrigins = {};
    let values: Record<string, unknown> = {};
    let nextReloadIn: number | undefined;

    const paths = await globby(this.pluginOptions.files);

    debug('paths', paths);

    for (const file of paths) {
      if (path.extname(file) === '.js') {
        debug('basePath', this.configDugOptions.basePath);
        const module = await import(path.join(this.configDugOptions.basePath, file));

        if (typeof module === 'object') {
          values = { ...values, ...module };
          this.recordValueOrigins(module, file);
        }
      } else if (path.extname(file) === '.json') {
        const contents = await fs.readFile(file, 'utf8');

        try {
          const module = JSON.parse(contents);

          if (typeof module === 'object') {
            values = { ...values, ...module };
            this.recordValueOrigins(module, file);
          }
        } catch (error) {
          console.error('Error parsing JSON file', file, error);
        }
      }
    }

    this.getNextReloadInterval(this.pluginOptions.reloadInterval);

    debug('plugin values', values);
    debug('plugin value origins', this.valueOrigins);
    debug('plugin reload in', nextReloadIn);

    return {
      values,
      valueOrigins: this.valueOrigins,
      nextReloadIn,
    };
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

  private getNextReloadInterval(reloadInterval: string | number | undefined): number | undefined {
    if (typeof reloadInterval === 'string') {
      const reloadIn = ms(reloadInterval);

      return reloadIn + Date.now();
    } else if (typeof reloadInterval === 'number') {
      return reloadInterval + Date.now();
    }
  }
}

export { FilePlugin };
