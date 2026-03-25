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

## Publishing

### Alpha versions

Sometimes, testing functionality locally using symlinks can be challenging.
In such cases, publishing an alpha version for use in other environments can be a practical way to test new changes.

1. Make sure the version in `package.json` is following this format: `<<major>>.<<minor>>.<<patch>>-alpha.<<alpha version>>` (e.g. `1.2.5-alpha.0`, `1.2.5-alpha.1`, etc.).
1. Make sure all changes including the version bump, lock file and your library changes are committed and pushed to your feature branch.
1. Run `npm publish --tag alpha` (To be able to publish the new NPM package the user should be included on the [NPM Publisher List](https://www.npmjs.com/settings/neofinancial/teams/team/publishers/users). If you're not on that list ask for help to publish.)

### Beta versions (Release candidate)

In some rare situations we need to test Library changes versions on a few services in Production, before rolling out this change to all services that uses the library. How it works:

1. Make sure the version in `package.json` is following this format: `<<major>>.<<minor>>.<<patch>>-beta.<<beta version>>` (e.g. `1.2.5-beta.0`, `1.2.5-beta.1`, etc.).
1. Make sure all changes including the version bump, lock file and your library changes are committed and pushed to your feature branch.
1. Open a Pull Request targeting the merge to a branch that matches with the following pattern: "\**/*release-candidate\*"
1. After getting approvals, merge your changes into the Release Candidate branch;
1. Run `npm publish --tag beta` (To be able to publish the new NPM package the user should be included on the [NPM Publisher List](https://www.npmjs.com/settings/neofinancial/teams/team/publishers/users). If you're not on that list ask for help to publish.)

### Stable versions

Once your changes have been tested and you're ready to publish a stable version, open your Pull Request, get approvals, merge it and publish the new package version. How it works:

1. Make sure the version in `package.json` is following this format: `<<major>>.<<minor>>.<<patch>>` (e.g. `1.2.5`, `1.3.0`, etc.).
1. Make sure all changes including the version bump, lock file and your library changes are committed and pushed to your feature branch.
1. Pull request is approved and merged into `master` branch;
1. Run `npm publish --tag latest` (To be able to publish the new NPM package the user should be included on the [NPM Publisher List](https://www.npmjs.com/settings/neofinancial/teams/team/publishers/users). If you're not on that list ask for help to publish.)

## License

MIT
