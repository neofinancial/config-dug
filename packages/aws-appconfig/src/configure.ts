import {
  configureAppConfigClient,
  getAppConfigClient,
  resetAppConfigClient,
  type AppConfigAgentClient,
} from './client.js';
import { getAppConfigs, warnConflictingAppConfigKeys } from './app-config.js';
import { getFeatureFlags } from './feature-flags.js';
import { type AppConfigOptions, resolveAppConfigClientOptions } from './options.js';

/**
 * Configures AppConfig profile access against the AppConfig Agent.
 */
export function configureAppConfig(options: AppConfigOptions): AppConfigAgentClient {
  return configureAppConfigClient(resolveAppConfigClientOptions(options));
}

/**
 * Validates connectivity by fetching each configured profile once.
 * Also warns if the same top-level key appears in more than one freeform profile.
 */
export async function warmUpAppConfig(): Promise<void> {
  const { configurations, featureFlagConfigurations } = getAppConfigClient();

  if (configurations.length > 0) {
    warnConflictingAppConfigKeys(await getAppConfigs());
  }

  if (featureFlagConfigurations.length > 0) {
    await getFeatureFlags();
  }
}

/** Resets module configuration. Intended for tests. */
export function resetAppConfig(): void {
  resetAppConfigClient();
}
