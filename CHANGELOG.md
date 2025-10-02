# Changelog

## 1.10.0 (October 2, 2025)

- Update dependencies
- Set minimum Node version to 20 (current LTS version)

## 1.9.0 (September 13, 2024)

- Enabled support for nested objects and arrays loaded from AWS Secrets

## 1.8.0 (August 21, 2024)

- Upgrade to aws-sdk v3
- Update dependencies
- Increase minimum Node version to 18 (current oldest LTS version)

## 1.7.2 (March 23, 2022)

- Add a warning when a local config file is found

## 1.7.1 (October 16, 2021)

- switched to npm
- updated dependencies

## 1.7.0 (May 14, 2021)

- Add feature to override aws secrets configs with environment variables

## 1.6.2 (December 4, 2020)

- Update all console warnings to console logs
- Do not validate configs in development

## 1.6.1 (November 13, 2020)

- Update yarn.lock for security warning on `kind-of`

## 1.6.0 (October 26, 2020)

- Warn on leading or trailing whitespace in secret value
- Suppress secret undefined warning if running tests
- Add `AWS_SECRETS_MANAGER_NAMES` key to define multiple secrets in a backwards compatible way

## 1.5.0 (October 17, 2020)

- Add support for multiple AWS Secrets Manager secrets in the same region

## 1.4.2 (October 17, 2020)

- Warn if a config is undefined, null, 'undefined' or an empty string

## 1.4.1 (October 17, 2020)

- Better error logging when fetching from Secrets Manager
- Updated `httpOptions` to use `timeout` instead of `connectTimeout`

## 1.4.0 (November 28, 2019)

- Add support for APP_ENV
- Update dependencies

## 1.3.1 (November 4, 2019)

Fix bug in float parsing regex

## 1.3.0 (September 16, 2019)

Add AWS Secrets Manager connection timeout

## 1.2.0 (August 29, 2019)

- Convert AWS Secrets Manager string values to correct types
- Fix a bug with parsing integers and floats
- Remove lodash

## 1.1.0 (June 14, 2019)

Add support for environment specific local config files

## 1.0.0 (April 11, 2019)

Initial release! :tada:
