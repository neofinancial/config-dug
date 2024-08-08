'use strict';

import { Credentials, SSM } from 'aws-sdk';
import { spawnSync, SpawnSyncReturns } from 'child_process';

interface SSMOptions {
  region?: string;
  credentials?: Credentials;
  [key: string]: unknown;
}

interface Parameter {
  Name: string;
}

interface QueryResult<T = SSM.Parameter> {
  success: boolean;
  result?: T;
  err?: { message: string; code?: string };
}

function getParameterSync(name: string, options: SSMOptions): SSM.Parameter | undefined {
  const params: Parameter = { Name: name };

  const opts = {
    options,
    funcName: 'getParameter',
    parameters: [params],
  };

  const result: SpawnSyncReturns<Buffer> = spawnSync('node', [`${__dirname}/ssm_sync`], {
    input: JSON.stringify([opts]),
    maxBuffer: 4000000,
    encoding: 'buffer',
  });

  const queryResult: QueryResult = JSON.parse(result.stdout.toString());

  if (queryResult.success) {
    return queryResult.result;
  } else {
    throw new Error(queryResult.err?.message || queryResult.err?.code);
  }
}

export { getParameterSync };
