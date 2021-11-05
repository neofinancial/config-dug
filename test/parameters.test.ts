jest.mock('aws-param-store');
import * as awsClient from 'aws-param-store';

import * as fs from 'fs';
import path from 'path';

import { loadConfig } from '../src';
import getParameters from '../src/get-parameters';

let mockGetParametersSyncResponse = {};

describe('getParameters', () => {
  beforeEach(() => {
    mockGetParametersSyncResponse = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../test/fixtures/parameters/aws-parameter-store-response.json'),
        'utf-8'
      )
    );
    jest.spyOn(awsClient, 'getParametersSync').mockReturnValueOnce(mockGetParametersSyncResponse);
  });

  test('should return the expected key/value pairs', () => {
    const configuration = getParameters(
      {
        SQS_CONSUME_IMPORTANT_EVENT_URL: 'target-service/sqs-consume-important-event-url',
        ALLOWED_GREEK_LETTER_LIST: 'target-service/allowed-greek-letters-list',
      },
      'us-east-1',
      5000
    );

    expect(configuration).toEqual({
      SQS_CONSUME_IMPORTANT_EVENT_URL:
        'https://sqs.us-east-1.amazonaws.com/111222333444/consume-important-event',
      ALLOWED_GREEK_LETTER_LIST: 'alpha,beta,gamma',
    });
  });

  test('should run in the context of loadConfig()', () => {
    const configuration = loadConfig('test/fixtures/parameters');

    expect(configuration).toMatchObject({
      AWS_PARAMETER_NAMES: {
        SQS_CONSUME_IMPORTANT_EVENT_URL: 'target-service/sqs-consume-important-event-url',
        ALLOWED_GREEK_LETTER_LIST: 'target-service/allowed-greek-letters-list',
      },
      SQS_CONSUME_IMPORTANT_EVENT_URL:
        'https://sqs.us-east-1.amazonaws.com/111222333444/consume-important-event',
      ALLOWED_GREEK_LETTER_LIST: 'alpha,beta,gamma',
    });
  });
});
