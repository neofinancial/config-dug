import chalk from 'chalk';

import { ConfigDugConfig, ConfigDugSchema, ValueOrigins } from '../config-dug.js';

const getValue = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined';
  } else if (value === '') {
    return "'' <empty string>";
  } else if (typeof value === 'string') {
    return value;
  } else {
    return JSON.stringify(value);
  }
};

const printConfig = <T extends ConfigDugSchema>(values: ConfigDugConfig<T>, valueOrigins: ValueOrigins) => {
  const sortedKeyValues = Object.entries(values).sort((a, b) => (a[0] > b[0] ? 1 : -1));

  for (const [key, value] of sortedKeyValues) {
    const origin =
      valueOrigins[key]
        ?.reverse()
        .map((origin, index) => (index > 0 ? chalk.strikethrough(origin) : origin))
        .join(' ← ') || 'unknown';

    console.log(`${chalk.green(key)}: ${chalk.magenta(getValue(value))} ${chalk.gray(`[${origin}]`)}`);
  }
};

export { printConfig };
