/* eslint-disable no-console */

import readline from 'readline';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', async (input) => {
  const args = JSON.parse(input);
  const options = args.options;
  const secretName = args.secretName;
  const client = new SecretsManagerClient({
    region: options.region,
    requestHandler: new NodeHttpHandler({
      connectionTimeout: options.timeout,
    }),
  });

  try {
    const result = await client.send(new GetSecretValueCommand({ SecretId: secretName }));

    console.log(JSON.stringify({ success: true, result }));
  } catch (error) {
    const err = Object.assign({}, error, { message: error.message });
    const resultObj = { success: false, err };

    console.log(JSON.stringify(resultObj));
  } finally {
    rl.close();
  }
});
