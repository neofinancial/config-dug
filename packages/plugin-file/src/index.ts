import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigDugOptions, ConfigDugPluginOutput, BaseConfigDugPlugin } from '../../config-dug/src/index';
import createDebug from 'debug';
import globby from 'globby';
import ms from 'ms';

export interface FilePluginOptions {
  files: string[];
  reloadInterval?: string | number;
}

const debug = createDebug('config-dug:plugin:file');

class FilePlugin extends BaseConfigDugPlugin<FilePluginOptions> {
  private configDugOptions: ConfigDugOptions | undefined;
  private valueOrigins: Record<string, string[]> = {};

  constructor(options: FilePluginOptions) {
    super(options);
    this.pluginOptions = options;
  }

  public override initialize = async (configDugOptions: ConfigDugOptions): Promise<void> => {
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
        const basePath = this.configDugOptions.basePath;
        if (!basePath) {
          throw new Error('basePath is not set in configDugOptions');
        }
        const module = await import(path.join(basePath, file));

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

    nextReloadIn = this.getNextReloadInterval(this.pluginOptions.reloadInterval);

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
      if (!this.valueOrigins[key]) {
        this.valueOrigins[key] = [];
      }
      if (!this.valueOrigins[key].includes(origin)) {
        this.valueOrigins[key].push(origin);
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
