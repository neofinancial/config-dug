import {
  getFeatureFlag,
  type AppConfigFeatureFlag,
  type AppConfigFeatureFlagContextValue,
  type AppConfigFeatureFlagParseOptions,
} from './feature-flags.js';

export interface AppConfigGlobalFeatureFlagEvaluationOptions {
  /** Optional stable identifier forwarded as the `Entity-Id` header. */
  entityId?: string;
  /**
   * Values exposed to AppConfig variant rules. Use whichever identifiers the
   * flag rules expect, such as `userId` or `email`.
   *
   * Do not set `currentEpoch` here. `getGlobalFeatureFlag()` always overwrites
   * it with `Math.floor(Date.now() / 1000)` so variant rules can compare
   * `(gte $currentEpoch <activation>)`.
   */
  context?: Readonly<Record<string, AppConfigFeatureFlagContextValue>>;
}

/**
 * Returns an AppConfig Agent-evaluated global feature flag.
 *
 * Global flags are a console contract, not a custom payload. Create a
 * multi-variant flag in an `AWS.AppConfig.FeatureFlags` profile:
 *
 * - Default variant: disabled (`enabled: false`). This is the value before
 *   activation and whenever no rule matches.
 * - After-activation variant: `enabled: true` (or the post-cutover attributes).
 *   Its rule **must** include `(gte $currentEpoch <unix-seconds>)` so every
 *   service flips at the same wall-clock time instead of whenever the agent
 *   next polls a new configuration.
 * - Optional traffic split, targeting, or `userId` / `email` checks belong in
 *   that same rule with `and`.
 *
 * This method always sends `Context: currentEpoch=<seconds since epoch>`. The
 * sidecar evaluates the rule; this library does not compare timestamps itself.
 * For boolean checks, prefer `isGlobalFeatureFlagEnabled()`. Pass `parse` only
 * for extra variant attributes.
 */
export async function getGlobalFeatureFlag<TFlag extends AppConfigFeatureFlag = AppConfigFeatureFlag>(
  flagName: string,
  evaluation: AppConfigGlobalFeatureFlagEvaluationOptions = {},
  options?: AppConfigFeatureFlagParseOptions<TFlag>
): Promise<TFlag> {
  return getFeatureFlag<TFlag>(
    flagName,
    {
      entityId: evaluation.entityId,
      context: {
        ...evaluation.context,
        currentEpoch: Math.floor(Date.now() / 1000),
      },
    },
    options
  );
}

/**
 * Returns whether a global feature flag is enabled after AppConfig Agent
 * evaluates `currentEpoch` against the flag's variant rules.
 */
export async function isGlobalFeatureFlagEnabled(
  flagName: string,
  evaluation: AppConfigGlobalFeatureFlagEvaluationOptions = {}
): Promise<boolean> {
  return (await getGlobalFeatureFlag(flagName, evaluation)).enabled;
}
