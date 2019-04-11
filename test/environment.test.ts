import { loadConfig } from '../src';

test('loading config from environment variable works', (): void => {
  process.env.KEY_3 = 'true';

  const testConfig = loadConfig('test/fixtures/typescript');

  expect(testConfig).toMatchObject({
    KEY_1: 'value 1',
    KEY_2: true,
    KEY_3: true,
    KEY_4: 42,
    KEY_5: 4.2
  });

  delete process.env.KEY_3;
});
