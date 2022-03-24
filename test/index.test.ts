/* eslint-disable no-console */
import { loadConfig } from '../src';

test('loading TypeScript config works', (): void => {
  const testConfig = loadConfig('test/fixtures/typescript');

  expect(testConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: false,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_7: 'local key',
    KEY_8: 1,
    KEY_9: 'bar',
  });
});

test('loading JavaScript config works', (): void => {
  const testConfig = loadConfig('test/fixtures/javascript');

  expect(testConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: false,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_7: 'local key',
    KEY_8: 1,
    KEY_9: 'bar',
  });
});

test('loading staging environment config with NODE_ENV works', (): void => {
  process.env.NODE_ENV = 'staging';

  const devConfig = loadConfig('test/fixtures/typescript');

  expect(devConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: false,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_6: 'staging environment key',
    KEY_7: 'local key',
    KEY_8: 3,
    KEY_9: 'bar',
    KEY_10: 'staging local key',
  });

  process.env.NODE_ENV = 'test';
});

test('loading staging environment config with APP_ENV works', (): void => {
  process.env.APP_ENV = 'staging';

  const devConfig = loadConfig('test/fixtures/typescript');

  expect(devConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: false,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_6: 'staging environment key',
    KEY_7: 'local key',
    KEY_8: 3,
    KEY_9: 'bar',
    KEY_10: 'staging local key',
  });

  process.env.NODE_ENV = 'test';
});

test('loading invalid config does nothing', (): void => {
  const invalidConfig = loadConfig('noexist');

  expect(typeof invalidConfig).toBe('object');
});

test('config value that is undefined causes a warning when env is not test', (): void => {
  process.env.APP_ENV = 'staging';

  jest.spyOn(global.console, 'log');

  loadConfig('test/fixtures/validate');

  expect(console.log).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_3');
  expect(console.log).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_4');
  expect(console.log).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_5');

  jest.clearAllMocks();
  process.env.APP_ENV = 'test';
});

test('config value that is undefined does not cause a warning when env is development', (): void => {
  process.env.APP_ENV = 'development';

  jest.spyOn(global.console, 'log');

  loadConfig('test/fixtures/validate');

  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_3');
  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_4');
  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_5');

  jest.clearAllMocks();
  process.env.APP_ENV = 'test';
});

test('config value that is undefined does not cause a warning when env is test', (): void => {
  jest.spyOn(global.console, 'log');

  loadConfig('test/fixtures/validate');

  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_3');
  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_4');
  expect(console.log).not.toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_5');

  jest.clearAllMocks();
});

test('loading config values with leading and/or trailing whitespace causes a warning', (): void => {
  process.env.APP_ENV = 'staging';

  const spy = jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());

  loadConfig('test/fixtures/validate');

  expect(console.log).toHaveBeenCalledWith(
    'WARNING: Found leading and/or trailing whitespace within config value for KEY_6'
  );
  expect(console.log).toHaveBeenCalledWith(
    'WARNING: Found leading and/or trailing whitespace within config value for KEY_7'
  );
  expect(console.log).toHaveBeenCalledWith(
    'WARNING: Found leading and/or trailing whitespace within config value for KEY_8'
  );

  spy.mockRestore();
  process.env.APP_ENV = 'test';
});

test('loading a local config will cause a warning', (): void => {
  process.env.APP_ENV = 'development';

  const spy = jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());

  loadConfig('test/fixtures/typescript');

  expect(console.log).toHaveBeenCalledWith('WARNING: Found a local config file config.local.ts');

  spy.mockRestore();
  process.env.APP_ENV = 'test';
});
