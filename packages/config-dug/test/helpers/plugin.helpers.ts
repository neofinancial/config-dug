import { vi } from 'vitest';
import { ConfigDugPlugin } from '../../src/lib/plugin';

export function createMockPlugin(params: any): ConfigDugPlugin {
  return {
    ...params,
    initialized: true,
    load: vi.fn(),
    initialize: vi.fn(),
    getNextReloadIn: vi.fn(),
    reload: vi.fn(),
  };
}
