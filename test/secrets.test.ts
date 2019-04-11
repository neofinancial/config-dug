import { loadConfig } from '../src';

jest.mock('../src/get-secret');

test('loading secrets from AWS Secrets Manager works', (): void => {
  const testConfig = loadConfig('test/fixtures/secrets');

  expect(testConfig).toMatchObject({
    AWS_SECRETS_MANAGER_NAME: 'development/config-dug',
    DB_USERNAME: 'config-dug',
    DB_PASSWORD: 'secret'
  });
});
