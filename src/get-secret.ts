/* eslint-disable no-console */
import path from 'path';
import { spawnSync } from 'child_process';

import { SecretObject } from '.';

const getSecret = (secretName: string, region: string, timeout: number): SecretObject => {
  try {
    const rawValue = spawnSync('node', [path.join(__dirname, 'secrets-manager.js')], {
      input: JSON.stringify({
        options: { region, timeout },
        secretName: secretName,
      }),
    }).stdout.toString();

    const response = JSON.parse(rawValue);
    const secret = JSON.parse(response.result.SecretString);

    return secret;
  } catch (error) {
    console.error('ERROR: Unable to get secret from AWS SSM', {
      secretName,
      region,
      timeout,
    });

    console.error(error);

    return {};
  }
};

export default getSecret;
