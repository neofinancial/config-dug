import { vi } from 'vitest';

import { ConfigDugPlugin, KeyStyle } from '../../src/lib/plugin';

export function createMockPlugin(): ConfigDugPlugin {
  return {
    load: vi.fn(),
    initialize: vi.fn(),
    getNextReloadIn: vi.fn(),
    getPluginKeyStyle: vi.fn().mockReturnValue(KeyStyle.camelCase),
    reload: vi.fn(),
  };
}
