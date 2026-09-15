import { buildAgentRequestHeaders, type AppConfigAgentEvaluationOptions } from './agent-request.js';

export type { AppConfigAgentEvaluationOptions };

export interface AppConfigProfile {
  application: string;
  environment: string;
  configuration: string;
  key: string;
}

export interface AppConfigClientOptions {
  configurations: AppConfigProfile[];
  featureFlagConfigurations: AppConfigProfile[];
  agentBaseUrl: string;
}

export const DEFAULT_AGENT_BASE_URL = 'http://localhost:2772';

export class AppConfigAgentRequestError extends Error {
  public readonly status: number;
  public readonly url: string;

  public constructor(status: number, statusText: string, url: string) {
    super(`AppConfig Agent request failed (${status} ${statusText}): ${url}`);
    this.name = 'AppConfigAgentRequestError';
    this.status = status;
    this.url = url;
  }
}

export class AppConfigAgentClient {
  public readonly configurations: readonly AppConfigProfile[];
  public readonly featureFlagConfigurations: readonly AppConfigProfile[];
  public readonly agentBaseUrl: string;

  public constructor(options: AppConfigClientOptions) {
    this.configurations = [...options.configurations];
    this.featureFlagConfigurations = [...options.featureFlagConfigurations];
    this.agentBaseUrl = options.agentBaseUrl.replace(/\/$/, '');
  }

  public findConfigurationProfile(
    profiles: readonly AppConfigProfile[],
    key: string,
    moduleName: string
  ): AppConfigProfile {
    const profile = profiles.find((item) => item.key === key);

    if (!profile) {
      throw new Error(`Unknown AppConfig ${moduleName} profile key: ${key}`);
    }

    return profile;
  }

  public async fetchConfigurationDocument(
    profile: AppConfigProfile,
    evaluation?: AppConfigAgentEvaluationOptions
  ): Promise<unknown> {
    const text = await this.fetchFromAgent(buildProfileUrl(this.agentBaseUrl, profile), evaluation);

    return parseResponseBody(text);
  }

  public async fetchFeatureFlagDocument(
    profile: AppConfigProfile,
    flagName: string,
    evaluation?: AppConfigAgentEvaluationOptions
  ): Promise<unknown> {
    const text = await this.fetchFromAgent(
      buildProfileUrl(this.agentBaseUrl, profile, { flags: [flagName] }),
      evaluation
    );

    return parseResponseBody(text);
  }

  private async fetchFromAgent(url: string, evaluation?: AppConfigAgentEvaluationOptions): Promise<string> {
    const response = await fetch(url, { headers: buildAgentRequestHeaders(evaluation) });

    if (!response.ok) {
      throw new AppConfigAgentRequestError(response.status, response.statusText, url);
    }

    return response.text();
  }
}

let client: AppConfigAgentClient | undefined;

export function getAppConfigClient(): AppConfigAgentClient {
  if (!client) {
    throw new Error('AppConfig has not been configured. Call configureAppConfig() first.');
  }

  return client;
}

/** @internal */
export function configureAppConfigClient(options: AppConfigClientOptions): AppConfigAgentClient {
  client = new AppConfigAgentClient(options);

  return client;
}

/** @internal */
export function resetAppConfigClient(): void {
  client = undefined;
}

export function buildProfileUrl(agentBaseUrl: string, profile: AppConfigProfile, query?: { flags?: string[] }): string {
  const url = new URL(
    [
      'applications',
      encodeURIComponent(profile.application),
      'environments',
      encodeURIComponent(profile.environment),
      'configurations',
      encodeURIComponent(profile.configuration),
    ].join('/'),
    `${agentBaseUrl.replace(/\/$/, '')}/`
  );

  if (query?.flags?.length) {
    for (const flag of query.flags) {
      url.searchParams.append('flag', flag);
    }
  }

  return url.toString();
}

function parseResponseBody(text: string): unknown {
  if (text.length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
