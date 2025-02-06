import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FilePlugin } from '../src/index';
import fs from 'node:fs/promises';
import path from 'node:path';
import globby from 'globby';
vi.mock('node:fs/promises');
vi.mock('globby');

const testPluginOptions = {
  files: ['config.json', 'config.js'],
};

let plugin: FilePlugin;

beforeEach(() => {
  plugin = new FilePlugin(testPluginOptions);
});

describe('FilePlugin', () => {
  describe('initialize', () => {
    it('should initialize the plugin', async () => {
      await plugin.initialize({ basePath: '/base/path' });

      expect(plugin['initialized']).toBe(true);
    });
  });

  describe('load', () => {
    it('should load JSON files and return values', async () => {
      const mockJsonContent = JSON.stringify({ testKey: 'testValue' });
      (globby as any).mockResolvedValue(['config.json']);
      (fs.readFile as any).mockResolvedValue(mockJsonContent);

      await plugin.initialize({ basePath: '/base/path' });

      const output = await plugin.load();
      expect(output.values).toEqual({ testKey: 'testValue' });
    });

    it('should load JS files and return values', async () => {
      (globby as any).mockResolvedValue(['config.js']);
      (path.join as any) = vi.fn().mockReturnValue('/base/path/config.js');
      vi.mock('/base/path/config.js', () => ({ testKey: 'testValue' }));

      await plugin.initialize({ basePath: '/base/path' });

      const output = await plugin.load();
      expect(output.values).toEqual({ testKey: 'testValue' });
    });

    it('should throw an error if load is called before initialize', async () => {
      await expect(plugin.load()).rejects.toThrowError('Plugin not initialized');
    });

    it('should handle JSON files with invalid content', async () => {
      (globby as any).mockResolvedValue(['config.json']);
      (fs.readFile as any).mockResolvedValue('invalid-json');

      await plugin.initialize({ basePath: '/base/path' });

      await expect(plugin.load()).resolves.toEqual({
        values: {},
        valueOrigins: {},
        nextReloadIn: undefined,
      });
    });

    it('should handle empty files array', async () => {
      plugin = new FilePlugin({ files: [] });
      await plugin.initialize({ basePath: '/base/path' });

      await expect(plugin.load()).resolves.toEqual({
        values: {},
        valueOrigins: {},
        nextReloadIn: undefined,
      });
    });

    it('should handle empty secrets', async () => {
      await plugin.initialize({});
      await expect(plugin.load()).resolves.toEqual({
        values: {},
        valueOrigins: {},
        nextReloadIn: undefined,
      });
    });

    it('should reload files based on reloadInterval', async () => {
      const reloadInterval = 100;
      plugin = new FilePlugin({ files: ['config.json'], reloadInterval });

      const mockJsonContent = JSON.stringify({ testKey: 'testValue' });
      (globby as any).mockResolvedValueOnce(['config.json']);
      (fs.readFile as any).mockResolvedValueOnce(mockJsonContent);

      await plugin.initialize({ basePath: '/base/path' });

      const output = await plugin.load();

      expect(output.values).toEqual({ testKey: 'testValue' });
      expect(output.nextReloadIn).toBeGreaterThan(Date.now());
    });

    it('should reload files based on reloadInterval', async () => {
      const reloadInterval = 100;
      plugin = new FilePlugin({ files: ['config.json'], reloadInterval });

      const mockJsonContent = JSON.stringify({ testKey: 'testValue' });
      (globby as any).mockResolvedValueOnce(['config.json']);
      (fs.readFile as any).mockResolvedValueOnce(mockJsonContent);
      await plugin.initialize({ basePath: '/base/path' });

      const output = await plugin.load();

      expect(output.values).toEqual({ testKey: 'testValue' });
      expect(output.nextReloadIn).toBeGreaterThan(Date.now());
    });

    it('should reload values correctly', async () => {
      const reloadInterval = 100;
      const files = ['config.json'];
      plugin = new FilePlugin({ files, reloadInterval });

      const mockJsonContent1 = JSON.stringify({ testKey: 'initialValue' });
      const mockJsonContent2 = JSON.stringify({ testKey: 'reloadedValue' });
      (globby as any).mockResolvedValueOnce(files);
      (fs.readFile as any).mockResolvedValueOnce(mockJsonContent1);

      await plugin.initialize({ basePath: '/base/path' });

      let output = await plugin.load();
      expect(output.values).toEqual({ testKey: 'initialValue' });

      (fs.readFile as any).mockResolvedValueOnce(mockJsonContent2);
      output = await plugin.load();
      expect(output.values).toEqual({ testKey: 'reloadedValue' });
      expect(output.valueOrigins).toEqual({ testKey: ['config.json'] });
      expect(output.nextReloadIn).toBeGreaterThan(Date.now());
    });
  });
});
