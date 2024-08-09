/* eslint-disable no-console */
import path from 'path';
import { spawnSync } from 'child_process';

import { SecretObject } from '.';

const getSecret = (secretName: string, region: string, timeout: number): SecretObject => {
  try {
    const rawValue = spawnSync('node', [path.join(__dirname, 'ssm.js')], {
      input: JSON.stringify({
        options: { region },
        secretName: secretName + '/config',
      }),
    }).stdout.toString();
    const response = JSON.parse(rawValue);
    const secret = JSON.parse(response.result.Parameter.Value);

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
