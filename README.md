# Config Dug

Config management library for Node.js with support for multiple environments, config files, environment variables and plugins

> [!NOTE]
> Looking for v1? You can find it under the [`v1`](https://github.com/neofinancial/config-dug/tree/v1) branch.

![Config Dug logo](./config-dug.png)

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
