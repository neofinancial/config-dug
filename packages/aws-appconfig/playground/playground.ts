/**
 * Playground for @config-dug/aws-appconfig
 *
 * 1. Fill in the setup object below.
 * 2. Run: npm run playground --workspace=@config-dug/aws-appconfig
 *
 * Leave an array empty to skip that section. The sidecar default is http://localhost:2772.
 */
import {
  configureAppConfig,
  getAppConfigs,
  getAppConfigValue,
  getFeatureFlag,
  getFeatureFlags,
  getGlobalFeatureFlag,
  getProfileAppConfig,
  getProfileAppConfigValue,
  getProfileFeatureFlag,
  getProfileFeatureFlags,
  isFeatureFlagEnabled,
  isGlobalFeatureFlagEnabled,
  isProfileFeatureFlagEnabled,
  warmUpAppConfig,
  type AppConfigFeatureFlag,
} from '../src/index.js';

const playgroundSetup = {
  agentBaseUrl: 'http://localhost:2772',
  skipWarmup: false,

  application: 'my-app',
  environment: 'prod',

  configurations: [
    {
      configuration: 'service-config',
      key: 'serviceConfig',
    },
    // {
    //   configuration: 'system-config',
    //   key: 'systemConfig',
    // },
  ],

  featureFlagConfigurations: [
    {
      configuration: 'feature-flags',
      key: 'featureFlags',
    },
    // {
    //   configuration: 'system-flags',
    //   key: 'systemFlags',
    // },
  ],

  /** Top-level key inside a freeform JSON profile, e.g. logLevel. */
  configValueKey: 'logLevel',

  /** Native feature flag key, e.g. enableCheckout. */
  flagName: 'enableCheckout',

  /** Local key of the feature-flag profile used with getProfile* methods. */
  featureFlagProfileKey: 'featureFlags',

  /** Global multi-variant flag key, or undefined to skip section 7. */
  globalFlagName: 'checkout_v2' as string | undefined,

  /**
   * Placeholder variant attribute for the parse demo only.
   * Not sent to the sidecar. Rename if your flag actually has a different extra field.
   */
  exampleExtraField: 'example_extra_field',

  evaluation: {
    entityId: 'user-123',
    context: {
      userId: 'user-123',
      email: 'user@example.com',
    },
  },
};

function section(title: string): void {
  console.log(`\n========== ${title} ==========`);
}

async function run(label: string, action: () => Promise<unknown>): Promise<unknown> {
  try {
    const result = await action();
    console.log(`\n${label}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\n${label}`);
    console.log(`Error: ${message}`);
    return undefined;
  }
}

async function main(): Promise<void> {
  const {
    agentBaseUrl,
    skipWarmup,
    application,
    environment,
    configurations,
    featureFlagConfigurations,
    configValueKey,
    flagName,
    featureFlagProfileKey,
    globalFlagName,
    exampleExtraField,
    evaluation,
  } = playgroundSetup;

  section('1. Configure');
  const client = configureAppConfig({
    agentBaseUrl,
    configurations: configurations.map((profile) => ({
      application,
      environment,
      ...profile,
    })),
    featureFlagConfigurations: featureFlagConfigurations.map((profile) => ({
      application,
      environment,
      ...profile,
    })),
  });
  console.log(
    JSON.stringify(
      {
        agentBaseUrl: client.agentBaseUrl,
        configurations: client.configurations,
        featureFlagConfigurations: client.featureFlagConfigurations,
        evaluation,
      },
      null,
      2
    )
  );

  section('2. Warm up');
  if (skipWarmup) {
    console.log('Skipped (playgroundSetup.skipWarmup = true)');
  } else {
    await run('warmUpAppConfig()', () => warmUpAppConfig().then(() => ({ ok: true })));
  }

  if (configurations.length > 0) {
    await demonstrateConfigurations(configValueKey, configurations[0].key ?? configurations[0].configuration);
  }

  if (featureFlagConfigurations.length > 0) {
    await demonstrateFeatureFlags(flagName, featureFlagProfileKey, exampleExtraField, evaluation);
    await demonstrateGlobalFeatureFlags(globalFlagName, exampleExtraField, evaluation);
  }
}

async function demonstrateConfigurations(configValueKey: string, profileKey: string): Promise<void> {
  section('3. Freeform configuration');
  console.log('All profiles, one profile, a value across profiles, and a value from a named profile.');

  await run('getAppConfigs()', () => getAppConfigs());
  await run(`getProfileAppConfig('${profileKey}')`, () => getProfileAppConfig(profileKey));
  await run(`getAppConfigValue('${configValueKey}')`, () => getAppConfigValue(configValueKey));
  await run(`getProfileAppConfigValue('${profileKey}', '${configValueKey}')`, () =>
    getProfileAppConfigValue(profileKey, configValueKey)
  );
}

async function demonstrateFeatureFlags(
  flagName: string,
  profileKey: string,
  exampleExtraField: string,
  evaluation: typeof playgroundSetup.evaluation
): Promise<void> {
  section('4. Feature flags (boolean)');
  console.log('Typical path: isFeatureFlagEnabled() / isProfileFeatureFlagEnabled().');

  await run('getFeatureFlags(evaluation)', () => getFeatureFlags(evaluation));
  await run(`isFeatureFlagEnabled('${flagName}', evaluation)`, () => isFeatureFlagEnabled(flagName, evaluation));
  await run(`isProfileFeatureFlagEnabled('${profileKey}', '${flagName}', evaluation)`, () =>
    isProfileFeatureFlagEnabled(profileKey, flagName, evaluation)
  );

  section('5. Feature flags (object + _variant)');
  console.log(
    'getFeatureFlag() returns { enabled, _variant? }. Log _variant in application code, not in this library.'
  );

  const flag = (await run(`getFeatureFlag('${flagName}', evaluation)`, () => getFeatureFlag(flagName, evaluation))) as
    | AppConfigFeatureFlag
    | undefined;

  if (flag) {
    console.log('\nSuggested application log');
    console.log(JSON.stringify({ flag: flagName, enabled: flag.enabled, variant: flag._variant }, null, 2));
  }

  await run(`getProfileFeatureFlag('${profileKey}', '${flagName}', evaluation)`, () =>
    getProfileFeatureFlag(profileKey, flagName, evaluation)
  );
  await run(`getProfileFeatureFlags('${profileKey}', evaluation)`, () =>
    getProfileFeatureFlags(profileKey, evaluation)
  );

  section('6. Feature flags (complex parse)');
  console.log(`"${exampleExtraField}" is a placeholder variant attribute for this demo, not a sidecar argument.`);

  await run(`getFeatureFlag('${flagName}', evaluation, { parse })`, () =>
    getFeatureFlag(flagName, evaluation, {
      parse: (value) => parseExampleAttribute(value, exampleExtraField),
    })
  );
}

async function demonstrateGlobalFeatureFlags(
  globalFlagName: string | undefined,
  exampleExtraField: string,
  evaluation: typeof playgroundSetup.evaluation
): Promise<void> {
  section('7. Global feature flags');
  console.log('Always sends Context.currentEpoch (Unix seconds). Console rules must use (gte $currentEpoch <epoch>).');

  if (!globalFlagName) {
    console.log('Skipped: set playgroundSetup.globalFlagName.');
    return;
  }

  await run(`isGlobalFeatureFlagEnabled('${globalFlagName}', evaluation)`, () =>
    isGlobalFeatureFlagEnabled(globalFlagName, evaluation)
  );

  const flag = (await run(`getGlobalFeatureFlag('${globalFlagName}', evaluation)`, () =>
    getGlobalFeatureFlag(globalFlagName, evaluation)
  )) as AppConfigFeatureFlag | undefined;

  if (flag) {
    console.log('\nSuggested application log');
    console.log(JSON.stringify({ flag: globalFlagName, enabled: flag.enabled, variant: flag._variant }, null, 2));
  }

  await run(`getGlobalFeatureFlag('${globalFlagName}', evaluation, { parse })`, () =>
    getGlobalFeatureFlag(globalFlagName, evaluation, {
      parse: (value) => parseExampleAttribute(value, exampleExtraField),
    })
  );
}

function parseExampleAttribute(flag: AppConfigFeatureFlag, exampleAttribute: string): AppConfigFeatureFlag {
  if (!(exampleAttribute in flag)) {
    console.log(
      `parse note: "${exampleAttribute}" is not on this flag. That is expected unless you added that placeholder attribute in AppConfig.`
    );
  }

  return flag;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
