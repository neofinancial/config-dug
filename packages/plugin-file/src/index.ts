import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigDugOptions, ConfigDugPluginOutput, BaseConfigDugPlugin } from 'config-dug';
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

  public override async initialize(configDugOptions: ConfigDugOptions): Promise<void> {
    this.configDugOptions = configDugOptions;
    this.initialized = true;
  }

  public async load(): Promise<ConfigDugPluginOutput> {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }

    if (!this.configDugOptions) {
      throw new Error('ConfigDugOptions not set');
    }

    this.valueOrigins = {};
    const values: Record<string, unknown> = {};
    const nextReloadIn = this.getNextReloadInterval(this.pluginOptions.reloadInterval);

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
          Object.assign(values, module);
          this.recordValueOrigins(module, file);
        }

        continue;
      }

      if (path.extname(file) === '.json') {
        const contents = await fs.readFile(file, 'utf8');

        try {
          const module = JSON.parse(contents);

          if (typeof module === 'object') {
            Object.assign(values, module);
            this.recordValueOrigins(module, file);
          } else {
            console.warn(`Config file ${file} does not contain a valid JSON object`);
          }
        } catch (error) {
          console.error('Error parsing JSON file', file, error);
        }
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
  }

  private recordValueOrigins(values: Record<string, unknown>, origin: string) {
    for (const key of Object.keys(values)) {
      if (!this.valueOrigins[key]) {
        this.valueOrigins[key] = [origin];
      } else if (!this.valueOrigins[key].includes(origin)) {
        this.valueOrigins[key].push(origin);
      }
    }
  }

  private getNextReloadInterval(reloadInterval: string | number | undefined): number | undefined {
    if (typeof reloadInterval === 'string') {
      const reloadIn = ms(reloadInterval);

      return reloadIn + Date.now();
    }

    if (typeof reloadInterval === 'number') {
      return reloadInterval + Date.now();
    }
  }
}

export { FilePlugin };
