import { z } from 'zod';

import { ConfigDugConfig, ConfigDugSchema, UntypedConfig } from '../config-dug.js';
import { getSchemaWithPreprocessor } from './preprocessor.js';
import { errorMap, ErrorWithContext, reportErrors } from './reporter.js';
import { logger } from './logger.js';

const parseConfig = <T extends ConfigDugSchema>(
  schema: T,
  rawValues: UntypedConfig,
  strict: boolean
): [ConfigDugConfig<T>, string[]] => {
  const parsed: Record<string, unknown> = {} as any;
  const errors: ErrorWithContext[] = [];
  const defaults: string[] = [];

  for (const [key, schemaOrExtendedSchema] of Object.entries(schema)) {
    const value = rawValues[key];

    let defaultUsed = false;
    let defaultValue: unknown;

    try {
      if (schemaOrExtendedSchema instanceof z.ZodType) {
        if (value == null && schemaOrExtendedSchema instanceof z.ZodDefault) {
          defaultUsed = true;
          defaults.push(key);
          defaultValue = schemaOrExtendedSchema._def.defaultValue();

          parsed[key] = strict
            ? schemaOrExtendedSchema.parse(defaultValue, { errorMap })
            : getSchemaWithPreprocessor(schemaOrExtendedSchema).parse(defaultValue, { errorMap });
        } else {
          if (schemaOrExtendedSchema instanceof z.ZodDefault) {
            defaultValue = schemaOrExtendedSchema._def.defaultValue();
            defaults.push(key);
          }

          parsed[key] = strict
            ? schemaOrExtendedSchema.parse(value, { errorMap })
            : getSchemaWithPreprocessor(schemaOrExtendedSchema).parse(value, { errorMap });
        }
      } else {
        if (schemaOrExtendedSchema.schema instanceof z.ZodDefault) {
          defaultValue = schemaOrExtendedSchema.schema._def.defaultValue();
          defaults.push(key);
        }

        parsed[key] = strict
          ? schemaOrExtendedSchema.schema.parse(value, { errorMap })
          : getSchemaWithPreprocessor(schemaOrExtendedSchema.schema).parse(value, { errorMap });
      }
    } catch (error) {
      errors.push({ key, receivedValue: value, error, defaultUsed, defaultValue });
    }
  }

  if (errors.length > 0) {
    const errorList = reportErrors(errors, schema);

    logger.error('Errors found while parsing config');
    console.log(errorList);

    throw new Error(`Errors found while parsing config\n\n ${reportErrors(errors, schema)}`);
  }

  return [parsed as ConfigDugConfig<T>, defaults];
};

export { parseConfig };
