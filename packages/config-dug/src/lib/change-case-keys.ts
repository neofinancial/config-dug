// Implementation from https://www.npmjs.com/package/change-case
import * as changeCase from 'change-case';
import { UntypedConfig } from '../config-dug';

export enum KeyStyle {
  camelCase = 'camelCase',
  capitalCase = 'capitalCase',
  constantCase = 'constantCase',
  dotCase = 'dotCase',
  noCase = 'noCase',
  pascalCase = 'pascalCase',
  pathCase = 'pathCase',
  sentenceCase = 'sentenceCase',
  snakeCase = 'snakeCase',
}

const isObject = (object: unknown) => object !== null && typeof object === 'object';

function changeKeysFactory<Options extends changeCase.Options = changeCase.Options>(
  changeCase: (input: string, options?: changeCase.Options) => string
): (object: UntypedConfig, depth?: number, options?: Options) => UntypedConfig {
  return function changeKeys(object: UntypedConfig, depth = 1, options?: Options): UntypedConfig {
    if (depth === 0 || !isObject(object)) return {};

    const result: Record<string, unknown> = Object.create(Object.getPrototypeOf(object));

    Object.keys(object as object).forEach((key) => {
      const value = (object as Record<string, unknown>)[key];
      const changedKey = changeCase(key, options);
      result[changedKey] = value;
    });

    return result;
  };
}

export const camelCase = changeKeysFactory(changeCase.camelCase);
export const capitalCase = changeKeysFactory(changeCase.capitalCase);
export const constantCase = changeKeysFactory(changeCase.constantCase);
export const dotCase = changeKeysFactory(changeCase.dotCase);
export const noCase = changeKeysFactory(changeCase.noCase);
export const pascalCase = changeKeysFactory(changeCase.pascalCase);
export const pathCase = changeKeysFactory(changeCase.pathCase);
export const sentenceCase = changeKeysFactory(changeCase.sentenceCase);
export const snakeCase = changeKeysFactory(changeCase.snakeCase);
