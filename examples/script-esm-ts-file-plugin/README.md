# script-esm-ts-file-plugin

TypeScript ESM test script for Config Dug that uses the File Plugin

## Usage

- `npm start`: loads `config.development.js` which is an ESM file without issue
- `npm run start:staging`: loads `config.staging.mjs` without issue
- `npm run start:production`: loads `config.production.cjs` and logs a warning since this is an ESM project
