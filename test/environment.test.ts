import { loadConfig } from '../src';

test('loading config from environment variable works', (): void => {
  process.env.KEY_1 = 'value 1';
  process.env.KEY_3 = 'true';
  process.env.KEY_4 = '42';
  process.env.KEY_5 = '4.2';
  process.env.KEY_11 = '123456,123456';

  const testConfig = loadConfig('test/fixtures/typescript');

  expect(testConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: true,
    KEY_4: 42,
    KEY_5: 4.2,
    KEY_7: 'local key',
    KEY_8: 1,
    KEY_9: 'bar',
    KEY_11: '123456,123456',
  });

  delete process.env.KEY_3;
});
