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
    KEY_9: 'bar'
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
    KEY_9: 'bar'
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
    KEY_10: 'staging local key'
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
    KEY_10: 'staging local key'
  });

  process.env.NODE_ENV = 'test';
});

test('loading invalid config does nothing', (): void => {
  const invalidConfig = loadConfig('noexist');

  expect(typeof invalidConfig).toBe('object');
});

test('config value that is undefined causes a warning', (): void => {
  jest.spyOn(global.console, 'warn');

  loadConfig('test/fixtures/validate');

  expect(console.warn).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_3');
  expect(console.warn).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_4');
  expect(console.warn).toHaveBeenCalledWith('WARNING: Found undefined config value for KEY_5');
});
