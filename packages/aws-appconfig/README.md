# AWS AppConfig

A standalone client for retrieving freeform configuration and feature flags from the
[AWS AppConfig Agent](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-agent.html).
It does not depend on config-dug v2 or its plugin lifecycle.

## Install

```sh
npm install @config-dug/aws-appconfig
```

## Configure

```ts
import {
  configureAppConfig,
  getAppConfigValue,
  getProfileAppConfig,
  getProfileAppConfigValue,
  isFeatureFlagEnabled,
  isProfileFeatureFlagEnabled,
} from '@config-dug/aws-appconfig';

configureAppConfig({
  configurations: [
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'service-config',
      key: 'serviceConfig',
    },
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'system-config',
      key: 'systemConfig',
    },
  ],
  featureFlagConfigurations: [
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'feature-flags',
      key: 'featureFlags',
    },
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'system-flags',
      key: 'systemFlags',
    },
  ],
});

const profile = await getProfileAppConfig('serviceConfig');
const logLevel = await getAppConfigValue('logLevel');
const enabled = await isFeatureFlagEnabled('enableCheckout');
```

`getAppConfigValue()` and `isFeatureFlagEnabled()` search every configured profile of that type. If a config key exists in more than one profile, `getAppConfigValue()` and `warmUpAppConfig()` warn with those profile keys. `getAppConfigValue()` then returns the first configured match. Use `getProfileAppConfigValue()` to choose a profile:

```ts
await getProfileAppConfigValue('systemConfig', 'logLevel');
await isProfileFeatureFlagEnabled('systemFlags', 'enableCheckout');
```

The client defaults to `http://localhost:2772`. The AppConfig Agent owns AWS credentials,
polling, configuration sessions, and caching.

## Global feature flags

Use global flags when several services must change behavior at the **same Unix
epoch**, not whenever each agent's poll happens to pick up a new configuration.

This library does not compare timestamps. `getGlobalFeatureFlag()` and
`isGlobalFeatureFlagEnabled()` always send `Context: currentEpoch=<seconds since
epoch>` (`Math.floor(Date.now() / 1000)`). Callers cannot override that value.
AppConfig Agent evaluates it against **variant rules you configure in the
console**. If those rules omit `$currentEpoch`, the flag is not a global flag
in this contract and will not activate in lockstep.

### Console contract

1. Configuration profile type: **AWS.AppConfig.FeatureFlags** (native feature
   flags, not a freeform JSON document).
2. Flag type: **multi-variant**.
3. **Default variant**: `enabled: false` (and any pre-cutover attributes). This
   is what every service receives before the epoch and when no rule matches.
4. **After-activation variant**: `enabled: true` (or the post-cutover
   attributes). Its rule **must** include a numeric comparison on `currentEpoch`,
   using Unix seconds, for example `(gte $currentEpoch 1787832000)`.
5. Put targeting and percentage splits on that same rule. Rules run in order;
   the first match wins. One `(split pct::50 …)` plus the disabled default is a
   50/50 split after activation. Two sequential 50% rules are not.

Create the `AWS.AppConfig.FeatureFlags` profile first, then paste this as a
hosted configuration version (replace `1787832000` with your activation epoch).
The default variant has **no** `rule` and must stay last:

```json
{
  "flags": {
    "checkout_v2": {
      "name": "checkout_v2",
      "description": "Global checkout v2 cutover. After-activation rules must compare $currentEpoch (Unix seconds)."
    }
  },
  "values": {
    "checkout_v2": {
      "_variants": [
        {
          "name": "variant_enabled",
          "enabled": true,
          "rule": "(and (gte $currentEpoch 1787832000) (or (exists key::\"userId\") (exists key::\"email\")) (split pct::50 by::$userId seed::\"checkout_v2\"))"
        },
        {
          "name": "Default Variant",
          "enabled": false
        }
      ]
    }
  },
  "version": "1"
}
```

That rule requires `currentEpoch >= 1787832000` and then a 50% split hashed on
`userId` (use `by::$email` if you hash on email). Before the epoch, or when no
identifier matches, the agent returns the default variant (`enabled: false`).
Identifiers in `context` (`userId`, `email`, and so on) are optional and
caller-defined. `entityId` is forwarded as `Entity-Id` when provided and is not
copied onto any context key.

```ts
import { isGlobalFeatureFlagEnabled } from '@config-dug/aws-appconfig';

const enabled = await isGlobalFeatureFlagEnabled('checkout_v2', {
  entityId: user.id,
  context: {
    userId: user.id,
    email: user.email,
    country: user.country,
  },
});
```

The typical application check is `isGlobalFeatureFlagEnabled()`. Regular flags
that do not need a shared activation epoch should use `isFeatureFlagEnabled()`.

## Feature flag evaluation

```ts
const evaluation = {
  entityId: 'user-123',
  context: {
    email: 'user@example.com',
    opted_in_to_beta: true,
  },
};

await isFeatureFlagEnabled('enableCheckout', evaluation);
await isProfileFeatureFlagEnabled('featureFlags', 'enableCheckout', evaluation);
```

Evaluation values are forwarded through the agent's `Entity-Id` and `Context` headers.

### Complex flags

Most flags are booleans. `getFeatureFlag()` returns `AppConfigFeatureFlag`:

```ts
interface AppConfigFeatureFlag {
  enabled: boolean;
  _variant?: string;
}
```

`_variant` is set by AppConfig Agent when the flag is a multi-variant flag. It is the
name of the variant the sidecar selected (`variant_enabled`, `QA`, and so on). Basic
on/off flags usually omit it. This library does not log `_variant`; if you fetch the
flag object in application code, log `_variant` alongside `enabled` so you can see
which branch a request received:

```ts
const flag = await getFeatureFlag('checkout_v2', evaluation);

console.info('checkout_v2', { enabled: flag.enabled, variant: flag._variant });
```

Declare extra attributes with a type argument when the application needs them.
Use `parse` only when you also want a runtime check of that shape:

```ts
interface CheckoutFlag extends AppConfigFeatureFlag {
  example_extra_field: string;
}

const checkout = await getFeatureFlag<CheckoutFlag>('checkout_v2', evaluation, {
  parse: (flag) => {
    const exampleExtraField = (flag as { example_extra_field?: unknown }).example_extra_field;

    if (typeof exampleExtraField !== 'string') {
      throw new Error('checkout_v2 is missing example_extra_field');
    }

    return { ...flag, example_extra_field: exampleExtraField };
  },
});

checkout.example_extra_field;
```

The same type argument and optional `parse` apply to `getProfileFeatureFlag()` and
`getGlobalFeatureFlag()`. `parse` can be a Zod `.parse` function. The boolean
helpers stay `Promise<boolean>` and do not accept `parse`.

## Local playground

Edit the `playgroundSetup` object at the top of
`packages/aws-appconfig/playground/playground.ts`, then run:

```bash
npm run playground --workspace=@config-dug/aws-appconfig
```

The file walks through configure, warm up, freeform config, boolean flags, flag
objects (`_variant`), `parse`, and global flags (`currentEpoch`) using the
library API directly. Empty `configurations` / `featureFlagConfigurations`
arrays skip those sections. Set `globalFlagName` to `undefined` to skip global
flags.
