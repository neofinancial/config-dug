import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureAppConfig, resetAppConfig, warmUpAppConfig } from '../src/configure';
import {
  getAppConfigValue,
  getAppConfigs,
  getFeatureFlag,
  getFeatureFlags,
  getGlobalFeatureFlag,
  getProfileAppConfig,
  getProfileAppConfigValue,
  getProfileFeatureFlag,
  getProfileFeatureFlags,
  isGlobalFeatureFlagEnabled,
  isFeatureFlagEnabled,
  isProfileFeatureFlagEnabled,
} from '../src/index';
import { buildAgentRequestHeaders } from '../src/agent-request';
import { AppConfigAgentClient, buildProfileUrl, DEFAULT_AGENT_BASE_URL } from '../src/client';

const mockFetch = vi.fn();

const testAppConfigOptions = {
  configurations: [
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'service-config',
      key: 'serviceConfig',
    },
  ],
  featureFlagConfigurations: [
    {
      application: 'my-app',
      environment: 'prod',
      configuration: 'feature-flags',
      key: 'featureFlags',
    },
  ],
};

function mockOkResponse(body: string) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: vi.fn().mockResolvedValue(body),
  };
}

function mockFailedResponse(status: number, statusText: string) {
  return {
    ok: false,
    status,
    statusText,
    text: vi.fn().mockResolvedValue(''),
  };
}

beforeEach(() => {
  resetAppConfig();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('configureAppConfig', () => {
  it('throws when no profiles are configured', () => {
    expect(() => configureAppConfig({})).toThrow(
      'At least one AppConfig configuration or feature flag profile must be configured'
    );
  });

  it('returns an AppConfig agent client container', () => {
    const client = configureAppConfig(testAppConfigOptions);

    expect(client).toBeInstanceOf(AppConfigAgentClient);
    expect(client.agentBaseUrl).toBe(DEFAULT_AGENT_BASE_URL);
    expect(client.configurations).toEqual(testAppConfigOptions.configurations);
    expect(client.featureFlagConfigurations).toEqual(testAppConfigOptions.featureFlagConfigurations);
  });
});

describe('warmUpAppConfig', () => {
  it('requests freeform and feature flag profiles from the AppConfig Agent', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse('{}')).mockResolvedValueOnce(mockOkResponse('{}'));

    await warmUpAppConfig();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      buildProfileUrl(DEFAULT_AGENT_BASE_URL, testAppConfigOptions.configurations[0]),
      { headers: expect.any(Headers) }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      buildProfileUrl(DEFAULT_AGENT_BASE_URL, testAppConfigOptions.featureFlagConfigurations[0]),
      { headers: expect.any(Headers) }
    );
  });

  it('throws when the agent response is not ok', async () => {
    configureAppConfig({
      ...testAppConfigOptions,
      featureFlagConfigurations: [],
    });
    mockFetch.mockResolvedValueOnce(mockFailedResponse(503, 'Service Unavailable'));

    await expect(warmUpAppConfig()).rejects.toThrow(/AppConfig Agent request failed \(503 Service Unavailable\)/);
  });

  it('warns at warmup when the same config key exists in multiple profiles', async () => {
    configureAppConfig({
      configurations: [
        testAppConfigOptions.configurations[0],
        {
          application: 'my-app',
          environment: 'prod',
          configuration: 'system-config',
          key: 'systemConfig',
        },
      ],
      featureFlagConfigurations: [],
    });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockFetch
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'debug' })))
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'info' })));

    await warmUpAppConfig();

    expect(warning).toHaveBeenCalledWith(
      'AppConfig value "logLevel" exists in multiple profiles (serviceConfig, systemConfig). Using "serviceConfig". Pass a profile to getProfileAppConfigValue() to choose a different one.'
    );
  });
});

describe('getAppConfigs', () => {
  it('throws if called before configureAppConfig', async () => {
    await expect(getAppConfigs()).rejects.toThrow(/AppConfig has not been configured/);
  });

  it('queries every freeform profile on each call', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'debug' })));

    await expect(getAppConfigs()).resolves.toEqual({
      serviceConfig: { logLevel: 'debug' },
    });
  });
});

describe('getProfileAppConfig', () => {
  it('throws for an unknown freeform profile key without calling the agent', async () => {
    configureAppConfig(testAppConfigOptions);

    await expect(getProfileAppConfig('missing')).rejects.toThrow(
      'Unknown AppConfig configuration profile key: missing'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns one freeform profile document', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'debug' })));

    await expect(getProfileAppConfig('serviceConfig')).resolves.toEqual({ logLevel: 'debug' });
  });
});

describe('getAppConfigValue', () => {
  it('finds a value across multiple freeform profiles', async () => {
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
    });

    mockFetch
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ timeoutMs: 250 })))
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'info' })));

    await expect(getAppConfigValue('logLevel')).resolves.toBe('info');
  });

  it('warns and uses the first profile when the same value exists in multiple profiles', async () => {
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
    });

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mockFetch
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'debug' })))
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'info' })));

    await expect(getAppConfigValue('logLevel')).resolves.toBe('debug');
    expect(warning).toHaveBeenCalledWith(
      'AppConfig value "logLevel" exists in multiple profiles (serviceConfig, systemConfig). Using "serviceConfig". Pass a profile to getProfileAppConfigValue() to choose a different one.'
    );

    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ logLevel: 'info' })));
    await expect(getProfileAppConfigValue('systemConfig', 'logLevel')).resolves.toBe('info');
  });

  it('throws when a value is not present in any configured profile', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ timeoutMs: 250 })));

    await expect(getAppConfigValue('logLevel')).rejects.toThrow(
      'AppConfig value "logLevel" was not found in any configured profile'
    );
  });
});

describe('getGlobalFeatureFlag', () => {
  it('returns the native feature flag value evaluated by the agent', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, _variant: 'variant_enabled' })));

    await expect(
      getGlobalFeatureFlag('checkout_v2', {
        context: { email: 'user@example.com' },
      })
    ).resolves.toEqual({
      enabled: true,
      _variant: 'variant_enabled',
    });
  });

  it('provides a boolean helper for global flags', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, _variant: 'variant_enabled' })));

    await expect(
      isGlobalFeatureFlagEnabled('checkout_v2', {
        context: { userId: 'user-123' },
      })
    ).resolves.toBe(true);
  });

  it('forwards caller identifiers and always sends the current epoch', async () => {
    configureAppConfig(testAppConfigOptions);
    vi.spyOn(Date, 'now').mockReturnValue(1_787_832_001_000);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: false })));

    await getGlobalFeatureFlag('checkout_v2', {
      entityId: 'user-123',
      context: {
        email: 'user@example.com',
        userId: 'user-123',
        currentEpoch: 1,
      },
    });

    const headers = mockFetch.mock.calls[0][1]?.headers as Headers;

    expect(headers.get('Entity-Id')).toBe('user-123');
    expect(headers.get('Context')).toContain('email=user@example.com');
    expect(headers.get('Context')).toContain('userId=user-123');
    expect(headers.get('Context')).toContain('currentEpoch=1787832001');
    expect(mockFetch).toHaveBeenCalledWith(
      buildProfileUrl(DEFAULT_AGENT_BASE_URL, testAppConfigOptions.featureFlagConfigurations[0], {
        flags: ['checkout_v2'],
      }),
      { headers }
    );
  });

  it('sends currentEpoch even when no identifiers are provided', async () => {
    configureAppConfig(testAppConfigOptions);
    vi.spyOn(Date, 'now').mockReturnValue(1_787_832_000_000);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: false })));

    await getGlobalFeatureFlag('checkout_v2');

    const headers = mockFetch.mock.calls[0][1]?.headers as Headers;

    expect(headers.get('Entity-Id')).toBeNull();
    expect(headers.get('Context')).toBe('currentEpoch=1787832000');
  });

  it('optionally parses extra attributes on a global flag', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, rate_limit: 500 })));

    await expect(
      getGlobalFeatureFlag(
        'checkout_v2',
        { context: { userId: 'user-123' } },
        {
          parse: (flag) => {
            if (typeof (flag as { rate_limit?: unknown }).rate_limit !== 'number') {
              throw new Error('checkout_v2 is missing rate_limit');
            }

            return flag as { enabled: boolean; rate_limit: number };
          },
        }
      )
    ).resolves.toEqual({ enabled: true, rate_limit: 500 });
  });
});

describe('getFeatureFlags', () => {
  it('throws if called before configureAppConfig', async () => {
    await expect(getFeatureFlags()).rejects.toThrow(/AppConfig has not been configured/);
  });

  it('returns every configured feature flag profile', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(
      mockOkResponse(
        JSON.stringify({
          enableCheckout: { enabled: true },
        })
      )
    );

    await expect(getFeatureFlags()).resolves.toEqual({
      featureFlags: {
        enableCheckout: { enabled: true },
      },
    });
  });
});

describe('getProfileFeatureFlags', () => {
  it('throws if called before configureAppConfig', async () => {
    await expect(getProfileFeatureFlags('featureFlags')).rejects.toThrow(/AppConfig has not been configured/);
  });

  it('returns AWS retrieval-time feature flag documents', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(
      mockOkResponse(
        JSON.stringify({
          enableCheckout: { enabled: true, rolloutPercentage: 25 },
          darkMode: { enabled: false },
        })
      )
    );

    await expect(getProfileFeatureFlags('featureFlags')).resolves.toEqual({
      enableCheckout: { enabled: true, rolloutPercentage: 25 },
      darkMode: { enabled: false },
    });
  });

  it('throws when a feature flag payload is invalid', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ brokenFlag: { rolloutPercentage: 25 } })));

    await expect(getProfileFeatureFlags('featureFlags')).rejects.toThrow(/missing a boolean enabled property/);
  });
});

describe('getFeatureFlag', () => {
  it('requests a single flag from the agent', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, rolloutPercentage: 25 })));

    await expect(getFeatureFlag('enableCheckout')).resolves.toEqual({
      enabled: true,
      rolloutPercentage: 25,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      buildProfileUrl(DEFAULT_AGENT_BASE_URL, testAppConfigOptions.featureFlagConfigurations[0], {
        flags: ['enableCheckout'],
      }),
      { headers: expect.any(Headers) }
    );
  });

  it('optionally parses extra flag attributes for complex flags', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, rate_limit: 500 })));

    await expect(
      getFeatureFlag('enableCheckout', undefined, {
        parse: (flag) => {
          if (typeof (flag as { rate_limit?: unknown }).rate_limit !== 'number') {
            throw new Error('enableCheckout is missing rate_limit');
          }

          return flag as { enabled: boolean; rate_limit: number };
        },
      })
    ).resolves.toEqual({ enabled: true, rate_limit: 500 });
  });

  it('surfaces parse failures for complex flags', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true })));

    await expect(
      getFeatureFlag('enableCheckout', undefined, {
        parse: () => {
          throw new Error('enableCheckout is missing rate_limit');
        },
      })
    ).rejects.toThrow('enableCheckout is missing rate_limit');
  });

  it('builds evaluation headers for the agent', () => {
    const headers = buildAgentRequestHeaders({
      entityId: 'user-123',
      context: {
        email: 'user@example.com',
        opted_in_to_beta: true,
      },
    });

    expect(headers.get('Entity-Id')).toBe('user-123');
    expect(headers.get('Context')).toContain('email=user@example.com');
    expect(headers.get('Context')).toContain('opted_in_to_beta=true');
  });

  it('forwards evaluation headers on feature flag requests', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true })));

    await getFeatureFlag('enableCheckout', {
      entityId: 'user-123',
      context: {
        email: 'user@example.com',
        opted_in_to_beta: true,
      },
    });

    const headers = mockFetch.mock.calls[0][1]?.headers as Headers;

    expect(headers.get('Entity-Id')).toBe('user-123');
    expect(headers.get('Context')).toContain('email=user@example.com');
    expect(headers.get('Context')).toContain('opted_in_to_beta=true');
  });

  it('finds a flag across multiple feature flag profiles', async () => {
    configureAppConfig({
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

    mockFetch
      .mockResolvedValueOnce(mockFailedResponse(404, 'Not Found'))
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true, rollout: 25 })));

    await expect(getFeatureFlag('enableCheckout')).resolves.toEqual({ enabled: true, rollout: 25 });
  });

  it('requires a profile key when the same flag exists in multiple profiles', async () => {
    configureAppConfig({
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

    mockFetch
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true })))
      .mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: false })));

    await expect(getFeatureFlag('enableCheckout')).rejects.toThrow(
      'AppConfig feature flag "enableCheckout" exists in multiple profiles (featureFlags, systemFlags). Use getProfileFeatureFlag() to specify a profile.'
    );

    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true })));
    await expect(getProfileFeatureFlag('featureFlags', 'enableCheckout')).resolves.toEqual({ enabled: true });
  });

  it('throws when a flag is not present in any configured profile', async () => {
    configureAppConfig({
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

    mockFetch
      .mockResolvedValueOnce(mockFailedResponse(404, 'Not Found'))
      .mockResolvedValueOnce(mockFailedResponse(400, 'Bad Request'));

    await expect(getFeatureFlag('enableCheckout')).rejects.toThrow(
      'AppConfig feature flag "enableCheckout" was not found in any configured profile'
    );
  });
});

describe('isFeatureFlagEnabled', () => {
  it('returns the enabled state of a flag', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: true })));

    await expect(isFeatureFlagEnabled('enableCheckout')).resolves.toBe(true);
  });

  it('returns the enabled state for a named profile', async () => {
    configureAppConfig(testAppConfigOptions);
    mockFetch.mockResolvedValueOnce(mockOkResponse(JSON.stringify({ enabled: false })));

    await expect(isProfileFeatureFlagEnabled('featureFlags', 'enableCheckout')).resolves.toBe(false);
  });
});
