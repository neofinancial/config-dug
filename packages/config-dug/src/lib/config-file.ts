import fs from 'fs/promises';
import path from 'path';
import createDebug from 'debug';

import { UntypedConfig } from '../config-dug';
import { getModuleType } from './module-type.js';
import { logger } from './logger.js';

const debug = createDebug('config-dug:config-file');
const moduleType = getModuleType();

const exists = async (filename: string, basePath: string): Promise<boolean> => {
  try {
    await fs.stat(path.join(basePath, filename));

    return true;
  } catch {
    return false;
  }
};

const unshiftDefaultImport = (values: UntypedConfig): UntypedConfig => {
  if (values.default) {
    const { default: defaults, ...rest } = values;

    return {
      ...rest,
      ...defaults,
    };
  } else {
    return values;
  }
};

const loadConfigFile = async (
  filename: string,
  basePath: string,
  extensions: string[]
): Promise<[string | undefined, UntypedConfig]> => {
  for (const extension of extensions) {
    const filenameWithExtension = `${filename}.${extension}`;

    if (await exists(filenameWithExtension, basePath)) {
      debug('found file', `${filenameWithExtension}`);

      if (extension === 'cjs' && moduleType === 'ESM') {
        logger.warn(`Cannot load CJS file in ESM context, skipping: ${filename}.cjs`);

        return [undefined, {}];
      } else if (extension === 'mjs' && moduleType === 'CJS') {
        logger.warn(`Cannot load ESM file in CJS context, skipping: ${filename}.mjs`);

        return [undefined, {}];
      }

      try {
        const values = await import(path.join(basePath, filenameWithExtension));

        return [filenameWithExtension, unshiftDefaultImport(values)];
      } catch (error: any) {
        logger.warn(`Error loading config file ${filenameWithExtension}: ${error.message}`);

        return [undefined, {}];
      }
    }
  }

  return Promise.resolve([undefined, {}]);
};

export { loadConfigFile };
