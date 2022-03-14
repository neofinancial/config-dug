# Config Dug

[![Build status](https://github.com/neofinancial/config-dug/workflows/CI/badge.svg)](https://github.com/neofinancial/config-dug/actions)
[![coverage](https://coverage.neotools.ca/api/badge/master/4C8hhW7NzS4PKdA9C3NqNM)](https://coverage.neotools.ca/coverage/neofinancial/config-dug)
[![codecov](https://codecov.io/gh/neofinancial/config-dug/branch/master/graph/badge.svg)](https://codecov.io/gh/neofinancial/config-dug)
![TypeScript 3.7.2](https://img.shields.io/badge/TypeScript-3.7.2-brightgreen.svg)

![Config Dug](https://github.com/neofinancial/config-dug/blob/master/config-dug.png)

Config loader with support for AWS Secrets Manager.

## Usage

### Installation

| yarn                  | npm                      |
| --------------------- | ------------------------ |
| `yarn add config-dug` | `npm install config-dug` |

### Create your config files

`config-dug` looks in several places for your config, including config files in your project, environment variables and [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/). `config-dug` allows you to write your config files in either TypeScript or JavaScript. You are expected to export a default object from your config file:

```ts
// config.default.ts
export default {
  API_ENDPOINT: 'https://api.kanye.rest/',
};
```

```js
// config.default.js
module.exports = {
  API_ENDPOINT: 'https://api.kanye.rest/',
};
```

Environment specific config files are loaded based on the value of the `APP_ENV` or `NODE_ENV` environment variables. If `APP_ENV` is present it will take precedence over `NODE_ENV`.

Settings from these different sources are merged together into a single config object in the following order:

1. `config.default.{ts|js}`
1. `config.${APP_ENV|NODE_ENV}.{ts|js}`
1. `config.${APP_ENV|NODE_ENV}.local.{ts|js}`
1. `config.local.{ts|js}`
1. AWS Secrets Manager
1. Environment variables

By default your config files need to be placed in the root directory of your project. If you want to keep config files in a different directory see [Customizing Config Loading](#customizing-config-loading).

### Import config

Import `config-dug` anywhere in your code where you want to access your config. All of your settings are available on the imported object:

```ts
// app.ts
import config from 'config-dug';

console.log(config.API_ENDPOINT);
```

```js
// app.js
const config = require('config-dug').default;

console.log(config.API_ENDPOINT);
// https://api.kanye.rest/
```

> :warning: You must use `require('config-dug').default` in JavaScript files. If you exclude `.default` Config Dug will not work.

### Using AWS Secrets Manager

In order to use AWS Secrets Manager you have to add a `AWS_SECRETS_MANAGER_NAME` or `awsSecretsManagerName` setting to your config that specifies the names of the secrets to look up:

```ts
// config.default.ts
export default {
  AWS_SECRETS_MANAGER_NAME: 'production/myapp/config',
  API_ENDPOINT: 'https://api.kanye.rest/',
};
```

If you need to read from multiple secret buckets, `AWS_SECRETS_MANAGER_NAMES` takes a comma separated list to allow connection to multiple secrets in AWS Secrets Manager. Each secret from the list is evaluated in order mean that if a specific key appears in two secrets the value will be overwritten by the last secret in the list.

```ts
// config.default.ts
export default {
  AWS_SECRETS_MANAGER_NAMES: 'production/myapp/config,production/myapp/another-config',
  API_ENDPOINT: 'https://api.kanye.rest/',
};
```

In addition to specifying the secret name you can also provide a region using the `AWS_SECRETS_MANAGER_REGION` or `awsSecretsManagerRegion` setting. The connection timeout in milliseconds can also be specified using the `AWS_SECRETS_MANAGER_TIMEOUT` or `awsSecretsManagerTimeout` setting:

```ts

// config.default.ts
export default {
  AWS_SECRETS_MANAGER_NAME: 'production/myapp/config',
  AWS_SECRETS_MANAGER_REGION: 'us-west-2',
  AWS_SECRETS_MANAGER_TIMEOUT: 2000
  API_ENDPOINT: 'https://api.somecompany.com'
};
```

The default region is `us-east-1` and the default connection timeout is `5000`ms.

Config Dug will warn if it detects invalid config values. Invalid values include:

- undefined
- null
- the string 'undefined'
- an empty string

This package uses the [aws-sdk](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/) internally. Refer to their documentation for information about [authentication](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html), configuring a default [region](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html) and configuring [access control for AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access.html).

## Advanced

### Customizing Config Loading

If you want to load config files from a directory other than the project root you can import the `loadConfig` function and use it directly.

```ts
import { loadConfig } from 'config-dug';

loadConfig('config');
```

This will import your config files from the `config` directory. The path you specify must be relative to your project root.

### Debugging

`config-dug` uses the [debug](https://github.com/visionmedia/debug) library. To print debug messages for `config-dug` set `DEBUG=config-dug`.

## Contributing

### Running Tests

1. Fork this repo
1. Clone the forked repo
1. Install dependencies: `npm install` OR `npm i`
1. Run tests: `npm run test`

## Publishing

1. Update the version in `package.json`
1. Add a `CHANGELOG` entry
1. Commit your changes
1. Run `npm pack` to see what will be published then delete the `.tgz` file that was created
1. Run `npm publish`
1. Create a release on GitHub. Use the version as the tag and release name. For example for version `1.0.0` the tag and release name would be `v1.0.0`.

## Credits

This project was inspired by [config3](https://github.com/focusaurus/config3) and [config4](https://github.com/autolotto/config4).
