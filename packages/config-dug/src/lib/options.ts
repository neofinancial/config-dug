import { z } from 'zod';

export type ConfigDugOptions = z.infer<typeof optionsSchema>;
export type ConfigDugOptionsWithDefaults = z.infer<typeof optionsWithDefaultsSchema>;

const optionsSchema = z
  .object({
    basePath: z.string().optional(),
    envKey: z.string().optional(),
    loadConfigFiles: z.boolean().optional(),
    loadEnvironment: z.boolean().optional(),
    // TODO: Add plugin types
    plugins: z.array(z.any()).optional(),
    printConfig: z.boolean().optional(),
    strict: z.boolean().optional(),
    warnOnLocalConfigFile: z.boolean().optional(),
    reloadInterval: z.number().optional(),
    minReloadInterval: z.number().optional(),
  })
  .strict();

const optionsWithDefaultsSchema = z.object({
  basePath: z.string().default(process.cwd()),
  envKey: z.string().default('APP_ENV'),
  loadConfigFiles: z.boolean().default(true),
  loadEnvironment: z.boolean().default(true),
  plugins: z.array(z.any()).default([]),
  printConfig: z.boolean().default(false),
  strict: z.boolean().default(false),
  warnOnLocalConfigFile: z.boolean().default(true),
  reloadInterval: z.number().default(60000),
  minReloadInterval: z.number().default(10000),
});

const getOptions = (options: ConfigDugOptions): ConfigDugOptionsWithDefaults => {
  return optionsWithDefaultsSchema.parse(optionsSchema.parse(options));
};

export { getOptions };
