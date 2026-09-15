import { getAppConfigClient } from './client.js';

export type AppConfigValues = Readonly<Record<string, unknown>>;
export type AppConfigProfiles = Readonly<Record<string, unknown>>;

/**
 * Retrieves every configured freeform profile from the AppConfig Agent.
 */
export async function getAppConfigs(): Promise<AppConfigProfiles> {
  const client = getAppConfigClient();

  const entries = await Promise.all(
    client.configurations.map(async (profile) => {
      return [profile.key, await client.fetchConfigurationDocument(profile)] as const;
    })
  );

  return Object.fromEntries(entries);
}

/**
 * Retrieves one freeform profile by local key.
 */
export async function getProfileAppConfig(profileKey: string): Promise<unknown> {
  const client = getAppConfigClient();
  const profile = client.findConfigurationProfile(client.configurations, profileKey, 'configuration');

  return client.fetchConfigurationDocument(profile);
}

/**
 * Retrieves one top-level value by name across all configured freeform profiles.
 * If the same key exists in more than one profile, warns and returns the value
 * from the first configured profile. Use `getProfileAppConfigValue()` to pick a
 * specific profile.
 */
export async function getAppConfigValue(valueKey: string): Promise<unknown> {
  const client = getAppConfigClient();

  if (client.configurations.length === 0) {
    throw new Error('No AppConfig configuration profiles are configured');
  }

  const profiles = await getAppConfigs();
  const matches: { profileKey: string; value: unknown }[] = [];

  for (const [profileKey, document] of Object.entries(profiles)) {
    if (hasOwnValue(document, valueKey)) {
      matches.push({ profileKey, value: (document as AppConfigValues)[valueKey] });
    }
  }

  if (matches.length === 1) {
    return matches[0].value;
  }

  if (matches.length > 1) {
    warnConflictingAppConfigValue(
      valueKey,
      matches.map((match) => match.profileKey)
    );

    return matches[0].value;
  }

  throw new Error(`AppConfig value "${valueKey}" was not found in any configured profile`);
}

/**
 * Retrieves one top-level value from a named freeform profile.
 */
export async function getProfileAppConfigValue(profileKey: string, valueKey: string): Promise<unknown> {
  const document = await getProfileAppConfig(profileKey);

  if (!hasOwnValue(document, valueKey)) {
    throw new Error(`AppConfig value "${valueKey}" was not found in profile "${profileKey}"`);
  }

  return (document as AppConfigValues)[valueKey];
}

function warnConflictingAppConfigValue(valueKey: string, profileKeys: string[]): void {
  console.warn(
    `AppConfig value "${valueKey}" exists in multiple profiles (${profileKeys.join(', ')}). Using "${
      profileKeys[0]
    }". Pass a profile to getProfileAppConfigValue() to choose a different one.`
  );
}

/** Warns for every top-level key that appears in more than one freeform profile. */
export function warnConflictingAppConfigKeys(profiles: AppConfigProfiles): void {
  const locations = new Map<string, string[]>();

  for (const [profileKey, document] of Object.entries(profiles)) {
    if (typeof document !== 'object' || document === null || Array.isArray(document)) {
      continue;
    }

    for (const valueKey of Object.keys(document)) {
      const profileKeys = locations.get(valueKey) ?? [];
      profileKeys.push(profileKey);
      locations.set(valueKey, profileKeys);
    }
  }

  for (const [valueKey, profileKeys] of locations) {
    if (profileKeys.length > 1) {
      warnConflictingAppConfigValue(valueKey, profileKeys);
    }
  }
}

function hasOwnValue(document: unknown, valueKey: string): document is AppConfigValues {
  return typeof document === 'object' && document !== null && !Array.isArray(document) && valueKey in document;
}
