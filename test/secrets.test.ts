import { loadConfig } from '../src';

jest.mock('../src/get-secret');

test('loading secrets from AWS Secrets Manager works', (): void => {
  const testConfig = loadConfig('test/fixtures/secrets');

  expect(testConfig).toMatchObject({
    AWS_SECRETS_MANAGER_NAME: 'development/config-dug',
    DB_USERNAME: 'config-dug',
    DB_PASSWORD: 'secret',
    TEST_BOOLEAN: true,
    TEST_INTEGER: 42,
    TEST_FLOAT: 4.2,
    TEST_NUMBER_LIST: '123456,123456',
  });
});

test('loading multiple AWS Secrets Manager secrets works', (): void => {
  const testConfig = loadConfig('test/fixtures/multiple-secrets');

  expect(testConfig).toMatchObject({
    AWS_SECRETS_MANAGER_NAMES: 'development/config-dug-1, development/config-dug-2',
    AWS_SECRETS_MANAGER_NAME: 'development/config-dug-1',
    DB_USERNAME: 'config-dug',
    DB_PASSWORD: 'secret',
    TEST_BOOLEAN: true,
    TEST_INTEGER: 22,
    TEST_ANOTHER_INTEGER: 23,
  });
});

test('overriding AWS Secrets Manager secrets with env vars works', (): void => {
  process.env.AWS_SECRETS_MANAGER_NAMES = 'development/config-dug-1';

  const testConfig = loadConfig('test/fixtures/multiple-secrets');

  expect(testConfig).toMatchObject({
    AWS_SECRETS_MANAGER_NAMES: 'development/config-dug-1',
    AWS_SECRETS_MANAGER_NAME: 'development/config-dug-1',
    DB_USERNAME: 'config-dug',
    DB_PASSWORD: 'secret',
    TEST_BOOLEAN: true,
    TEST_INTEGER: 42,
  });
});
