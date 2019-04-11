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

test('loading development environment config works', (): void => {
  process.env.NODE_ENV = 'development';

  const devConfig = loadConfig('test/fixtures/typescript');

  expect(devConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: false,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_6: 'development environment key',
    KEY_7: 'local key',
    KEY_8: 2,
    KEY_9: 'bar'
  });

  process.env.NODE_ENV = 'test';
});

test('loading invalid config does nothing', (): void => {
  const invalidConfig = loadConfig('noexist');

  expect(typeof invalidConfig).toBe('object');
});
