import chalk from 'chalk';
import { ZodError, ZodErrorMap, ZodIssueCode } from 'zod';

import { ConfigDugSchema } from '../config-dug.js';

export interface ErrorWithContext {
  key: string;
  receivedValue: unknown;
  error: unknown;
  defaultUsed: boolean;
  defaultValue: unknown;
}

const errorMap: ZodErrorMap = (issue, ctx) => {
  if (issue.code === ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return { message: 'This field is required.' };
  }
  return { message: ctx.defaultError };
};

const indent = (line: string, depth: number) => `${' '.repeat(depth * 2)}${line}`;

const reportErrors = (errors: ErrorWithContext[], schemas: ConfigDugSchema): string => {
  const formattedErrors = errors.map(({ key, receivedValue, error, defaultUsed, defaultValue }) => {
    const message: string[] = [`[${chalk.green(key)}]:`];

    if (error instanceof ZodError) {
      const { formErrors, fieldErrors } = error.flatten();
      const fieldErrorEntries = Object.entries(fieldErrors);

      for (const formError of formErrors) {
        message.push(indent(formError, 1));
      }

      if (fieldErrorEntries.length > 0) {
        message.push(indent('Errors on object keys:', 1));

        for (const [key, keyErrors] of fieldErrorEntries) {
          message.push(indent(`[${chalk.green(key)}]:`, 2));

          if (keyErrors) {
            for (const keyError of keyErrors) {
              message.push(indent(keyError, 3));
            }
          }
        }
      }
    } else if (error instanceof Error) {
      message.push(...error.message.split('\n').map((line) => indent(line, 1)));
    } else {
      message.push(
        ...JSON.stringify(error, undefined, 1)
          .split('\n')
          .map((line) => indent(line, 1))
      );
    }

    message.push(
      indent(
        `(received ${chalk.magenta(receivedValue === undefined ? 'undefined' : JSON.stringify(receivedValue))})`,
        1
      )
    );

    if (defaultUsed) {
      message.push(
        indent(
          `(used default of ${chalk.magenta(defaultValue === undefined ? 'undefined' : JSON.stringify(defaultValue))})`,
          2
        )
      );
    }

    const description = schemas[key]?.description;

    if (description) {
      message.push('');
      message.push(`Description of [${chalk.yellow(key)}]: ${description}`);
    }

    return message.map((line) => indent(line, 1)).join('\n');
  });

  return `${formattedErrors.join('\n\n')}\n`;
};

export { reportErrors, errorMap };
