import {
  AppConfigAgentRequestError,
  getAppConfigClient,
  type AppConfigAgentEvaluationOptions,
  type AppConfigProfile,
} from './client.js';

export type AppConfigFeatureFlagEvaluationOptions = AppConfigAgentEvaluationOptions;
export type AppConfigFeatureFlagContextValue = string | number | boolean;
export type AppConfigFeatureFlagAttributeValue = string | number | boolean | ReadonlyArray<string | number>;

export interface AppConfigFeatureFlag {
  enabled: boolean;
  /** Name of the AppConfig variant selected by the agent. Omitted on basic flags. */
  _variant?: string;
}

export type AppConfigFeatureFlags = Readonly<Record<string, AppConfigFeatureFlag>>;
export type AppConfigFeatureFlagProfiles = Readonly<Record<string, AppConfigFeatureFlags>>;

/**
 * Optional runtime parser for flags that expose attributes beyond `enabled`.
 * Most call sites should use `isFeatureFlagEnabled()` instead.
 */
export interface AppConfigFeatureFlagParseOptions<TFlag extends AppConfigFeatureFlag = AppConfigFeatureFlag> {
  parse: (flag: AppConfigFeatureFlag) => TFlag;
}

async function resolveFeatureFlag(
  flagName: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions
): Promise<AppConfigFeatureFlag> {
  const client = getAppConfigClient();

  if (client.featureFlagConfigurations.length === 0) {
    throw new Error('No AppConfig feature flag profiles are configured');
  }

  const lookups = await Promise.all(
    client.featureFlagConfigurations.map(async (profile) => {
      try {
        return {
          profile,
          flag: parseSingleFeatureFlagDocument(
            await client.fetchFeatureFlagDocument(profile, flagName, evaluation),
            flagName,
            profile.key
          ),
        };
      } catch (error) {
        if (isFlagMissingFromProfile(error)) {
          return { profile, flag: undefined };
        }

        throw error;
      }
    })
  );

  const matches = lookups.filter(
    (lookup): lookup is { profile: AppConfigProfile; flag: AppConfigFeatureFlag } => lookup.flag !== undefined
  );

  if (matches.length === 1) {
    return matches[0].flag;
  }

  if (matches.length > 1) {
    const profileKeys = matches.map((match) => match.profile.key).join(', ');

    throw new Error(
      `AppConfig feature flag "${flagName}" exists in multiple profiles (${profileKeys}). Use getProfileFeatureFlag() to specify a profile.`
    );
  }

  throw new Error(`AppConfig feature flag "${flagName}" was not found in any configured profile`);
}

function isFlagMissingFromProfile(error: unknown): boolean {
  if (error instanceof AppConfigAgentRequestError) {
    return error.status === 400 || error.status === 404;
  }

  return (
    error instanceof Error &&
    (/did not return a JSON object/.test(error.message) || /is missing a boolean enabled property/.test(error.message))
  );
}

/**
 * Retrieves every configured feature flag profile from the AppConfig Agent.
 */
export async function getFeatureFlags(
  evaluation?: AppConfigFeatureFlagEvaluationOptions
): Promise<AppConfigFeatureFlagProfiles> {
  const client = getAppConfigClient();

  const entries = await Promise.all(
    client.featureFlagConfigurations.map(async (profile) => {
      return [
        profile.key,
        await parseFeatureFlagsDocument(await client.fetchConfigurationDocument(profile, evaluation), profile.key),
      ] as const;
    })
  );

  return Object.fromEntries(entries);
}

/**
 * Retrieves one feature flag profile by local key.
 */
export async function getProfileFeatureFlags(
  profileKey: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions
): Promise<AppConfigFeatureFlags> {
  const client = getAppConfigClient();
  const profile = client.findConfigurationProfile(client.featureFlagConfigurations, profileKey, 'feature flag');

  return parseFeatureFlagsDocument(await client.fetchConfigurationDocument(profile, evaluation), profile.key);
}

/**
 * Retrieves one flag by name across all configured feature flag profiles.
 * Use `getProfileFeatureFlag()` when the same flag name exists in more than one profile.
 * For boolean checks, prefer `isFeatureFlagEnabled()`. Pass `parse` only for extra attributes.
 */
export async function getFeatureFlag<TFlag extends AppConfigFeatureFlag = AppConfigFeatureFlag>(
  flagName: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions,
  options?: AppConfigFeatureFlagParseOptions<TFlag>
): Promise<TFlag> {
  const flag = await resolveFeatureFlag(flagName, evaluation);

  return (options?.parse ? options.parse(flag) : flag) as TFlag;
}

/**
 * Retrieves one flag from a named feature flag profile.
 */
export async function getProfileFeatureFlag<TFlag extends AppConfigFeatureFlag = AppConfigFeatureFlag>(
  profileKey: string,
  flagName: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions,
  options?: AppConfigFeatureFlagParseOptions<TFlag>
): Promise<TFlag> {
  const client = getAppConfigClient();
  const profile = client.findConfigurationProfile(client.featureFlagConfigurations, profileKey, 'feature flag');
  const flag = parseSingleFeatureFlagDocument(
    await client.fetchFeatureFlagDocument(profile, flagName, evaluation),
    flagName,
    profile.key
  );

  return (options?.parse ? options.parse(flag) : flag) as TFlag;
}

/**
 * Returns whether a flag is enabled, searching all configured feature flag profiles.
 */
export async function isFeatureFlagEnabled(
  flagName: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions
): Promise<boolean> {
  return (await getFeatureFlag(flagName, evaluation)).enabled;
}

/**
 * Returns whether a flag is enabled in a named feature flag profile.
 */
export async function isProfileFeatureFlagEnabled(
  profileKey: string,
  flagName: string,
  evaluation?: AppConfigFeatureFlagEvaluationOptions
): Promise<boolean> {
  return (await getProfileFeatureFlag(profileKey, flagName, evaluation)).enabled;
}

function parseSingleFeatureFlagDocument(document: unknown, flagName: string, profileKey: string): AppConfigFeatureFlag {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    throw new Error(`AppConfig feature flag "${flagName}" in profile "${profileKey}" did not return a JSON object`);
  }

  if (typeof (document as AppConfigFeatureFlag).enabled === 'boolean') {
    return document as AppConfigFeatureFlag;
  }

  const wrappedFlag = (document as Record<string, unknown>)[flagName];

  if (
    typeof wrappedFlag === 'object' &&
    wrappedFlag !== null &&
    !Array.isArray(wrappedFlag) &&
    typeof (wrappedFlag as AppConfigFeatureFlag).enabled === 'boolean'
  ) {
    return wrappedFlag as AppConfigFeatureFlag;
  }

  throw new Error(
    `AppConfig feature flag "${flagName}" in profile "${profileKey}" is missing a boolean enabled property`
  );
}

function parseFeatureFlagsDocument(document: unknown, profileKey: string): AppConfigFeatureFlags {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    throw new Error(`AppConfig feature flag profile "${profileKey}" did not return a JSON object`);
  }

  const flags: Record<string, AppConfigFeatureFlag> = {};

  for (const [flagName, value] of Object.entries(document)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(
        `AppConfig feature flag "${flagName}" in profile "${profileKey}" must be an object with an enabled property`
      );
    }

    if (typeof value.enabled !== 'boolean') {
      throw new Error(
        `AppConfig feature flag "${flagName}" in profile "${profileKey}" is missing a boolean enabled property`
      );
    }

    flags[flagName] = value as AppConfigFeatureFlag;
  }

  return flags;
}
