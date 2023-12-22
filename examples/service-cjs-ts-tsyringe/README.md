# service-cjs-ts-tsyringe

An example of a more complex long-running service that uses Config Dug and the AWS Secrets Manager plugin along with dependency injection with [TSyringe](https://github.com/microsoft/tsyringe)

## Usage

1. Make sure you have CLI access to AWS and a secret named `integration/config-dug-test/config`
1. `npm run start`

By default the secret will be refetched from AWS every 5 minutes. If you make any changes to the secret they should be reflected in the config within 5 minutes.
