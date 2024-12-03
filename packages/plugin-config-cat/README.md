# ConfigCat Plugin

A ConfigCat plugin for Config Dug
This plugin is used to support loading configuration values via the ConfigCat API: https://api.configcat.com/docs/

# Usage

## The ConfigCat SDK key

> [!IMPORTANT]
> The ConfigCat SDK key name will be specified within the plugin parameters. This sdk key value will need to be loadedfrom the environment variables in order to be used in this plugin.

## Defining the ConfigCat plugin

```ts
const configCatPlugin = new ConfigCatPlugin({
  sdkKeyName: 'CONFIG_CAT_SDK_KEY',
  sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
  targetedFlags: [
    {
      key: 'value1',
      defaultValue: false,
    },
    {
      key: 'value2',
      defaultValue: 'test default',
    },
  ],
});
```

### Parameter Reference

| Parameter        | Type     | Description                                                                |
| :--------------- | :------- | :------------------------------------------------------------------------- |
| `sdkKeyName`     | `string` | The name of the sdk key parameter to be loaded from environment variables. |
| `sourceKeyStyle` | `number` | The naming convention used by the plugin source. ex. SCREAMING_SNAKE_CASE  |
| `targetedFlags`  | `array`  | The definition of all targeted flags to be loaded by the plugin.           |

## Adding targeted flags to the Config Dug schema

> [!IMPORTANT]
> The ConfigCat plugin exports a custom type `targetedConfigCatFlagSchema` That can be used to define targeted flags within the schema. This is a custom zod definition that matches function definition returned by this plugin and should be used for all targeted flags.

```ts
const schema = {
  CONFIG_CAT_SDK_KEY: z.string(),
  value1: {
    schema: targetedConfigCatFlagSchema,
    description: 'Targeted ConfigCat config boolean',
    sensitive: false,
  },
};
```

## Adding the plugin to Config Dug

The ConfigCat flugin can be added to the plugins array in config dug constructor. Keep in mind the plugin load order dictates which values will be used.

```ts
const configDug = new ConfigDug(schema, {
  plugins: [configCatPlugin],
  printConfig: true,
});
```

## Complete example

```ts
const schema = {
  CONFIG_CAT_SDK_KEY: z.string(),
  value1: {
    schema: z.string(),
    description: 'Non-targeted ConfigCat string',
    sensitive: false,
  },
  value2: {
    schema: targetedConfigCatFlagSchema,
    description: 'Targeted ConfigCat value',
    sensitive: true,
  },
};

const configCatPlugin = new ConfigCatPlugin({
  sdkKeyName: 'CONFIG_CAT_SDK_KEY',
  sourceKeyStyle: 'SCREAMING_SNAKE_CASE',
  targetedFlags: [
    {
      key: 'value1',
      defaultValue: false,
    },
    {
      key: 'value2',
      defaultValue: 'test default',
    },
  ],
});

const configDug = new ConfigDug(schema, {
  plugins: [configCatPlugin],
  printConfig: true,
});

await configDug.load();
const config = configDug.getConfig();

console.log(config.value1); // returns a string value from ConfigCat
console.log(await config.value2({ identifier: 'Some Id Value' })); // returns the targeted flag response
```
