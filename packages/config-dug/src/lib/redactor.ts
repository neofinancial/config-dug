import { ConfigDugConfig, ConfigDugSchema, ConfigDugUnsealedConfig, ExtendedSchema } from '../config-dug.js';

const defaultRedactorFn = (): string => '[REDACTED]';

const redactConfig = <T extends ConfigDugSchema>(schema: T, values: ConfigDugConfig<T>): ConfigDugConfig<T> => {
  const redactedValues: ConfigDugUnsealedConfig<T> = {};

  for (const [key, value] of Object.entries(values)) {
    const isSensitive =
      schema[key] && ((schema[key] as ExtendedSchema).sensitive || (schema[key] as ExtendedSchema).redactorFn);
    const redactorFn: (input: string) => string =
      (schema[key] && (schema[key] as ExtendedSchema).redactorFn) || defaultRedactorFn;

    redactedValues[key as keyof ConfigDugConfig<T>] = isSensitive && value ? redactorFn(value) : value;
  }

  return redactedValues as ConfigDugConfig<T>;
};

export { defaultRedactorFn, redactConfig };
