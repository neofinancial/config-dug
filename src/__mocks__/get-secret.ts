/* eslint-disable import/no-restricted-paths */

import awsSecretsManagerResponse from '../../test/fixtures/secrets/aws-secrets-manager-response.json';

import multipleAwsSecretsManagerResponse1 from '../../test/fixtures/multiple-secrets/aws-secrets-manager-1-response.json';
import multipleAwsSecretsManagerResponse2 from '../../test/fixtures/multiple-secrets/aws-secrets-manager-2-response.json';

const getSecret = (secretName: string, __: string): Record<string, unknown> => {
  if (secretName === 'development/config-dug') {
    return JSON.parse(awsSecretsManagerResponse.Value);
  } else if (secretName === 'development/config-dug-1') {
    return JSON.parse(multipleAwsSecretsManagerResponse1.Value);
  } else if (secretName === 'development/config-dug-2') {
    return JSON.parse(multipleAwsSecretsManagerResponse2.Value);
  }

  return {};
};

export default getSecret;
