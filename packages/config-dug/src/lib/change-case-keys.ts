// Implementation from https://www.npmjs.com/package/change-case
import * as changeCase from 'change-case';

const isObject = (object: unknown) => object !== null && typeof object === 'object';

function changeKeysFactory<Options extends changeCase.Options = changeCase.Options>(
  changeCase: (input: string, options?: changeCase.Options) => string
): (object: object, depth?: number, options?: Options) => object {
  return function changeKeys(object: object, depth = 1, options?: Options): object {
    if (depth === 0 || !isObject(object)) return {};

    if (Array.isArray(object)) {
      return object.map((item) => changeKeys(item, depth - 1, options));
    }

    const result: Record<string, unknown> = Object.create(Object.getPrototypeOf(object));

    Object.keys(object as object).forEach((key) => {
      const value = (object as Record<string, unknown>)[key];
      const changedKey = changeCase(key, options);
      result[changedKey] = value;
    });

    return result;
  };
}

const camelCase = changeKeysFactory(changeCase.camelCase);
const capitalCase = changeKeysFactory(changeCase.capitalCase);
const constantCase = changeKeysFactory(changeCase.constantCase);
const dotCase = changeKeysFactory(changeCase.dotCase);
const noCase = changeKeysFactory(changeCase.noCase);
const pascalCase = changeKeysFactory(changeCase.pascalCase);
const pathCase = changeKeysFactory(changeCase.pathCase);
const sentenceCase = changeKeysFactory(changeCase.sentenceCase);
const snakeCase = changeKeysFactory(changeCase.snakeCase);

export { camelCase, capitalCase, constantCase, dotCase, noCase, pascalCase, pathCase, sentenceCase, snakeCase };
