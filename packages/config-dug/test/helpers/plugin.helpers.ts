import { vi } from 'vitest';

import { KeyStyle } from '../../src/lib/plugin';

export function createMockPlugin() {
  return {
    load: vi.fn(),
    initialize: vi.fn(),
    getNextReloadIn: vi.fn(),
    getPluginKeyStyle: vi.fn().mockReturnValue(KeyStyle.camelCase),
    reload: vi.fn(),
  };
}
