import awsSecretsManagerResponse from '../../test/fixtures/secrets/aws-secrets-manager-response.json';

function getSecret(_: string, __: string): object {
  return JSON.parse(awsSecretsManagerResponse.Value);
}

export default getSecret;
