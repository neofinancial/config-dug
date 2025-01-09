import createDebug from 'debug';

import { UntypedConfig, ValueOrigins } from '../config-dug.js';

const debug = createDebug('config-dug:lib:origins');

const recordOrigin = (valueOrigins: ValueOrigins, values: UntypedConfig | string[], origin: string): ValueOrigins => {
  if (Array.isArray(values)) {
    for (const key of values) {
      if (valueOrigins[key]) {
        valueOrigins[key] = [...valueOrigins[key], origin];
      } else {
        valueOrigins[key] = [origin];
      }
    }
  } else {
    for (const key of Object.keys(values)) {
      if (valueOrigins[key]) {
        valueOrigins[key] = [...valueOrigins[key], origin];
      } else {
        valueOrigins[key] = [origin];
      }
    }
  }

  return valueOrigins;
};

const recordOriginDefaults = (
  valueOrigins: ValueOrigins,
  values: UntypedConfig | string[],
  origin: string
): ValueOrigins => {
  if (Array.isArray(values)) {
    for (const key of values) {
      if (valueOrigins[key]) {
        valueOrigins[key] = [origin, ...valueOrigins[key]];
      } else {
        valueOrigins[key] = [origin];
      }
    }
  } else {
    for (const key of Object.keys(values)) {
      if (valueOrigins[key]) {
        valueOrigins[key] = [origin, ...valueOrigins[key]];
      } else {
        valueOrigins[key] = [origin];
      }
    }
  }

  return valueOrigins;
};

const mergeOrigins = (valueOrigins: ValueOrigins, newOrigins: ValueOrigins): ValueOrigins => {
  debug('original value origins', valueOrigins);
  debug('new value origins', newOrigins);

  for (const key of Object.keys(newOrigins)) {
    const valueOriginsTail = valueOrigins[key]?.slice(-newOrigins[key].length);

    if (valueOrigins[key] && !arrayEquals(valueOriginsTail, newOrigins[key])) {
      valueOrigins[key] = [...valueOrigins[key], ...newOrigins[key]];
    } else {
      valueOrigins[key] = [...newOrigins[key]];
    }
  }

  debug('merged value origins', valueOrigins);

  return valueOrigins;
};

const arrayEquals = (a: string[], b: string[]): boolean => {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
};

export { recordOrigin, recordOriginDefaults, mergeOrigins };
