/* eslint-disable no-console */

import awsParamStore from 'aws-param-store';

function getSecret(secretName: string, region: string): object {
  try {
    const secret = awsParamStore.getParameterSync(`/aws/reference/secretsmanager/${secretName}`, {
      region
    });

    return JSON.parse(secret.Value);
  } catch (error) {
    console.error('ERROR: Unable to get secret from AWS Secrets Manager');
    console.error(error);

    return {};
  }
}

export default getSecret;
