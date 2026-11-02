# Config Dug

Config management library for Node.js with support for multiple environments, config files, environment variables and plugins

> [!NOTE]
> Looking for v1? You can find it under the [`v1`](https://github.com/neofinancial/config-dug/tree/v1) branch.

![Config Dug logo](./config-dug.png)

## Latest Stable Release (v1.10.1)

Version 2 is currently available only as a prerelease. The examples in this section describe version 1.10.1, the latest stable release.

### Installation

```sh
npm install config-dug
```

### Basic Usage

Create a default configuration file in the root of your project:

```js
// config.default.js
module.exports = {
  API_ENDPOINT: 'https://api.example.com',
  FEATURE_ENABLED: false,
  RETRY_COUNT: 3,
};
```

Import the resolved configuration:

```ts
import config from 'config-dug';

console.log(config.API_ENDPOINT);
console.log(config.FEATURE_ENABLED);
console.log(config.RETRY_COUNT);
```

In a CommonJS JavaScript file, access the default export explicitly:

```js
const config = require('config-dug').default;
```

Config Dug loads the configuration synchronously when it is first imported. It merges values in this order, with later sources overriding earlier ones:

1. `config.default.{ts|js}`
2. `config.${APP_ENV|NODE_ENV}.{ts|js}`
3. `config.${APP_ENV|NODE_ENV}.local.{ts|js}`
4. `config.local.{ts|js}`
5. AWS Secrets Manager
6. Environment variables

`APP_ENV` takes precedence over `NODE_ENV`. If neither is set, Config Dug uses `development`.

### Environment Variables and Implicit Type Conversion

Environment variables are strings, but applications often expect boolean or numeric configuration values. Version 1.10.1 converts strings loaded from environment variables and AWS Secrets Manager as follows:

- `true` and `false`, in any combination of uppercase and lowercase characters, become booleans.
- Unsigned integer strings such as `0`, `42`, and `001` become numbers.
- Unsigned decimal strings such as `0.5` and `42.25` become numbers.
- Values inside arrays and objects returned by AWS Secrets Manager are converted recursively using the same rules.
- All other values remain unchanged.

For example:

```sh
FEATURE_ENABLED=TRUE RETRY_COUNT=5 node build/index.js
```

This produces the boolean `true` and the number `5`:

```ts
if (config.FEATURE_ENABLED === true) {
  console.log(`Feature enabled with ${config.RETRY_COUNT} retries`);
}
```

An explicit comparison is useful for feature flags. Only the boolean `true` enables the feature, so an unexpected, unconverted string does not enable it accidentally:

```ts
if (config.FEATURE_ENABLED !== true) {
  return;
}
```

Conversion is intentionally limited:

- Leading or trailing whitespace is not removed. For example, ` true ` remains a string.
- Negative numbers, scientific notation, and numbers such as `.5` or `5.` remain strings.
- JSON strings are not parsed into arrays or objects.
- Strings such as `yes`, `no`, `on`, `off`, `null`, and `undefined` are not converted.
- Values declared directly in config files are not implicitly converted; JavaScript and TypeScript preserve their existing runtime types.

Version 1 does not use a schema and does not validate expected types. In environments other than `development` and `test`, it warns about `undefined`, `null`, the string `undefined`, empty values, and strings with leading or trailing whitespace, but it still returns the configuration.

Config Dug adds all non-empty environment variables to the exported configuration object. Avoid exposing that object to client-side or server-rendered client code.

### AWS Secrets Manager

Set `AWS_SECRETS_MANAGER_NAME` to load one secret, or use a comma-separated `AWS_SECRETS_MANAGER_NAMES` value to load several:

```js
// config.production.js
module.exports = {
  AWS_SECRETS_MANAGER_NAMES: 'production/my-service/config,production/my-service/database',
  AWS_SECRETS_MANAGER_REGION: 'ca-central-1',
  AWS_SECRETS_MANAGER_TIMEOUT: 5000,
};
```

Secrets are merged in the listed order. Later secrets override earlier secrets, and environment variables override all secret values.

## Packages

- [config-dug](./packages/config-dug): Config Dug core library

### Plugins

- [@config-dug/plugin-aws-secrets-manager](./packages/plugin-aws-secrets-manager): [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) plugin

## Examples

- [@config-dug/script-cjs](./examples/script-cjs): CJS test script
- [@config-dug/script-cjs-ts](./examples/script-cjs-ts): TypeScript CJS test script
- [@config-dug/script-esm](./examples/script-esm): ESM test script
- [@config-dug/script-esm-ts](./examples/script-esm-ts): TypeScript ESM test script
- [@config-dug/service-cjs-ts-tsyringe](./examples/service-cjs-ts-tsyringe): TypeScript CJS test service with [TSyringe](https://github.com/microsoft/tsyringe)
- [@config-dug/service-esm-ts](./examples/service-esm-ts): TypeScript ESM test service

## Publishing Prerelease Versions

1. Increment the version number in `package.json` in the package you want to publish (not the `package.json` in the project root)
1. Run `npm publish --tag next` in the package your want to publish (not in the project root)

## License

MIT
