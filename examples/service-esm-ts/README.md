# service-esm-ts

An example of a basic long-running service that uses Config Dug and the AWS Secrets Manager plugin

## Usage

1. Make sure you have CLI access to AWS and a secret named `integration/config-dug-test/config`
1. `npm run start`

By default the secret will be refetched from AWS every 5 minutes. If you make any changes to the secret they should be reflected in the config within 5 minutes.
