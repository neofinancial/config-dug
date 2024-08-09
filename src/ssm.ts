/* eslint-disable no-console */

import readline from 'readline';
import awsLite from '@aws-lite/client';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', async (input) => {
  const args = JSON.parse(input);
  const options = args.options;
  const secretName = args.secretName;
  const name = '/aws/reference/secretsmanager/' + secretName;
  const aws = await awsLite({
    region: options.region,
    // @ts-ignore
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    plugins: [import('@aws-lite/ssm')],
  });

  try {
    const result = await aws.SSM.GetParameter({ Name: name, WithDecryption: true });

    console.log(JSON.stringify({ success: true, result }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const err = Object.assign({}, error, { message: error.message });
    const resultObj = { success: false, err };

    console.log(JSON.stringify(resultObj));
} finally {
    rl.close();
  }
});
