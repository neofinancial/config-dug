# script-cjs

CJS test script for Config Dug

## Usage

- `npm start`: loads `config.development.js` which is a CJS file without issue
- `npm run start:staging`: loads `config.staging.mjs` and logs a warning since this is a CJS project
- `npm run start:production`: loads `config.production.cjs` without issue
