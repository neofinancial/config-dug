# File Plugin

A file plugin for Config Dug

This plugin is used to support loading configuration values via the File API: https://api.configcat.com/docs/

# Usage

## Defining the File plugin

```ts
const filePlugin = new FilePlugin({
  files: ['config.json'],
  reloadInterval: '1m',
});
```

### Parameter Reference

| Parameter        | Type     | Description                                                                       |
| :--------------- | :------- | :-------------------------------------------------------------------------------- |
| `files`          | `string` | The file extensions used for configuration values                                 |
| `reloadInterval` | `array`  | Specifies the interval at which the plugin should reload the configuration files. |

## Adding targeted flags to the Config Dug schema

> [!IMPORTANT]
> The File plugin exports a custom type `targetedFileFlagSchema` That can be used to define targeted flags within the schema. This is a custom zod definition that matches function definition returned by this plugin and should be used for all targeted flags.

```ts
const schema = {
  value1: {
    schema: targetedFileFlagSchema,
    description: 'Targeted File config boolean',
    sensitive: false,
  },
};
```

## Adding the plugin to Config Dug

The File plugin can be added to the plugins array in config dug constructor. Keep in mind the plugin load order dictates which values will be used.

```ts
const configDug = new ConfigDug(schema, {
  plugins: [filePlugin],
  printConfig: true,
});
```

## Export your configuration

The file plugin will read from your configuration files. Currently supported formats include .js and .json.

```js
module.exports = {
  logLevel: 'debug',
};
```

## Complete example

```ts
const schema = {
  value1: {
    schema: z.string(),
    description: 'Non-targeted File string',
    sensitive: false,
  },
  value2: {
    schema: targetedFileFlagSchema,
    description: 'Targeted File value',
    sensitive: true,
  },
};

const filePlugin = new FilePlugin({
  files: ['config.json'],
  reloadInterval: '1m',
});

const configDug = new ConfigDug(schema, {
  plugins: [filePlugin],
  printConfig: true,
});

await configDug.load();
const config = configDug.getConfig();

console.log(config.value1); // returns a string value from File
console.log(await config.value2({ identifier: 'Some Id Value' })); // returns the targeted flag response
```
