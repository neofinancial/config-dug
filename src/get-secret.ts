/* eslint-disable no-console */

import awsParamStore from 'aws-param-store';

import { SecretObject } from '.';

const getSecret = (secretName: string, region: string, timeout: number): SecretObject => {
  try {
    const secret = awsParamStore.getParameterSync(`/aws/reference/secretsmanager/${secretName}`, {
      region,
      httpOptions: {
        timeout,
      },
    });

    return JSON.parse(secret.Value);
  } catch (error) {
    console.error('ERROR: Unable to get secret from AWS Secrets Manager', {
      secretName,
      region,
      timeout,
    });

    console.error(error);

    return {};
  }
};

export default getSecret;
