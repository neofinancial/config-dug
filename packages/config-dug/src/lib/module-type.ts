export type ModuleType = 'CJS' | 'ESM';

const getModuleType = (): ModuleType => {
  if (typeof require !== 'undefined' && typeof __dirname !== 'undefined') {
    return 'CJS';
  } else {
    return 'ESM';
  }
};

export { getModuleType };
