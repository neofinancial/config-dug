import { DEFAULT_AGENT_BASE_URL, type AppConfigClientOptions, type AppConfigProfile } from './client.js';

export interface AppConfigProfileOptions {
  application: string;
  environment: string;
  configuration: string;
  key?: string;
}

export interface AppConfigOptions {
  /** Freeform configuration profiles loaded via `getAppConfigs()` / `getProfileAppConfig()`. */
  configurations?: AppConfigProfileOptions[];
  /** Feature flag profiles loaded via `getFeatureFlags()` / `getProfileFeatureFlags()`. */
  featureFlagConfigurations?: AppConfigProfileOptions[];
  /** AppConfig Agent base URL. Defaults to `http://localhost:2772`. */
  agentBaseUrl?: string;
}

export function normalizeProfiles(profiles: AppConfigProfileOptions[] = []): AppConfigProfile[] {
  return profiles.map((profile) => ({
    ...profile,
    key: profile.key ?? profile.configuration,
  }));
}

export function resolveAppConfigClientOptions(options: AppConfigOptions): AppConfigClientOptions {
  const configurations = normalizeProfiles(options.configurations);
  const featureFlagConfigurations = normalizeProfiles(options.featureFlagConfigurations);

  if (configurations.length === 0 && featureFlagConfigurations.length === 0) {
    throw new Error('At least one AppConfig configuration or feature flag profile must be configured');
  }

  return {
    configurations,
    featureFlagConfigurations,
    agentBaseUrl: options.agentBaseUrl ?? DEFAULT_AGENT_BASE_URL,
  };
}
