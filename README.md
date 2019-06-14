# Config Dug

![Config Dug](https://github.com/neofinancial/config-dug/blob/master/config-dug.png "Config Dug")

Config loader with support for AWS Secrets Manager.

![TypeScript 3.4.3](https://img.shields.io/badge/TypeScript-3.4.3-brightgreen.svg)

## Usage

### Installation

| yarn                | npm                    |
|---------------------|------------------------|
|`yarn add config-dug`|`npm install config-dug`|

### Create your config files

`config-dug` looks in several places for your config, including config files in your project, environment variables and [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/). `config-dug` allows you to write your config files in either TypeScript or JavaScript. You are expected to export a default object from your config file:

```ts
// config.default.ts
export default {
  API_ENDPOINT: 'https://api.kanye.rest/'
};
```

```js
// config.default.js
module.exports = {
  API_ENDPOINT: 'https://api.kanye.rest/'
};
```

Settings from these different sources are merged together into a single config object in the following order:

1. `config.default.{ts|js}`
1. `config.${NODE_ENV}.{ts|js}`
1. `config.${NODE_ENV}.local.{ts|js}`
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
// https://api.kanye.rest/
```

```js
// app.js
const config = require('config-dug');

console.log(config.API_ENDPOINT);
// https://api.kanye.rest/
```

### Using AWS Secrets Manager

In order to use AWS Secrets Manager you have to add a `AWS_SECRETS_MANAGER_NAME` or `awsSecretsManagerName` setting to your config that specifies the name of the secret to look up:

```ts
// config.default.ts
export default {
  AWS_SECRETS_MANAGER_NAME: 'production/myapp/config',
  API_ENDPOINT: 'https://api.kanye.rest/'
}
```

In addition to specifying the secret name you can also provide a region using the `AWS_SECRETS_MANAGER_REGION` or `awsSecretsManagerRegion` setting:

```ts
// config.default.ts
export default {
  AWS_SECRETS_MANAGER_NAME: 'production/myapp/config',
  AWS_SECRETS_MANAGER_REGION: 'us-west-2',
  API_ENDPOINT: 'https://api.somecompany.com'
}
```

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
1. Install dependencies: `yarn`
1. Run tests: `yarn test`

## Credits

This project was inspired by [config3](https://github.com/focusaurus/config3) and [config4](https://github.com/autolotto/config4).
