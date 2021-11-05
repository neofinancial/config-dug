/* eslint-disable no-console */
import awsParamStore from 'aws-param-store';

import { SecretObject } from '.';

const getParameters = (
  parameterMap: Record<string, string>,
  region: string,
  timeout: number
): SecretObject => {
  const parameters: SecretObject = {};
  let parameterNames: string[];

  try {
    parameterNames = Object.values(parameterMap);

    const parameterQueryResults = awsParamStore.getParametersSync(parameterNames, {
      region,
      httpOptions: {
        timeout,
      },
    });

    const getKeyByValue = (map: Record<string, string>, value: string): string => {
      return Object.keys(map).find((key) => map[key] === value);
    };

    parameterQueryResults.Parameters?.forEach((ssmParameter) => {
      const key = getKeyByValue(parameterMap, ssmParameter.Name);

      parameters[key] = ssmParameter.Value;
    });

    parameterQueryResults.InvalidParameters?.forEach((ssmParameterName) => {
      console.log(`Parameter "${ssmParameterName}" not found in SSM Parameter Store`);

      // const key = getKeyByValue(parameterMap, ssmParameterName);

      // parameters[key] = undefined;
    });

    return parameters;
  } catch (error) {
    console.error('ERROR: Unable to get parameter(s) from AWS System Manager Parameter Store', {
      parameterNames,
      region,
      timeout,
    });

    console.error(error);

    return parameters;
  }
};

export default getParameters;
