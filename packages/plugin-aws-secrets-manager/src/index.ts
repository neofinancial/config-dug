import {
  ConfigDugPlugin,
  ConfigDugOptions,
  ConfigDugPluginOutput,
  BaseConfigDugPlugin,
  ConfigDugPluginOptions,
} from 'config-dug';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import createDebug from 'debug';
import ms from 'ms';

export interface AWSSecretsManagerPluginSecretOptions {
  name: string;
  region: string;
  reloadInterval?: string | number;
}

export interface AWSSecretsManagerPluginOptions extends ConfigDugPluginOptions {
  secrets: AWSSecretsManagerPluginSecretOptions[];
}

interface AWSSecretsManagerPluginSecret {
  client: SecretsManagerClient;
  getSecretValueCommand: GetSecretValueCommand;
  getSecretValueCommandOutput?: GetSecretValueCommandOutput;
  config: AWSSecretsManagerPluginSecretOptions;
  nextReloadAt?: number;
  isLoaded?: boolean;
}

const debug = createDebug('config-dug:plugin:aws-secrets-manager');

class AWSSecretsManagerPlugin extends BaseConfigDugPlugin<AWSSecretsManagerPluginOptions> {
  private secrets: AWSSecretsManagerPluginSecret[] = [];
  private valueOrigins: Record<string, string[]> = {};

  constructor(options: AWSSecretsManagerPluginOptions) {
    super(options);
    this.pluginOptions = options;
  }

  public initialize = async (_: ConfigDugOptions): Promise<void> => {
    this.secrets = this.createSecrets();

    this.initialized = true;
  };

  public load = async (): Promise<ConfigDugPluginOutput> => {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }

    this.valueOrigins = {};
    let values: Record<string, unknown> = {};
    let nextReloadIn: number | undefined;

    for (const secret of this.secrets) {
      if (!secret.isLoaded) {
        debug('initial load of secret', secret.config.name);
        secret.getSecretValueCommandOutput = await secret.client.send(secret.getSecretValueCommand);
        secret.isLoaded = true;

        if (secret.config.reloadInterval) {
          nextReloadIn = this.getNextReloadInterval(secret);
        }
      } else if (secret.nextReloadAt && secret.nextReloadAt < Date.now()) {
        debug('refreshing secret', `${secret.config.region}:${secret.config.name}`);
        secret.getSecretValueCommandOutput = await secret.client.send(secret.getSecretValueCommand);

        nextReloadIn = this.getNextReloadInterval(secret, nextReloadIn);
      }

      if (secret.getSecretValueCommandOutput?.SecretString) {
        const secretString = secret.getSecretValueCommandOutput.SecretString;

        try {
          const newValues = JSON.parse(secretString);

          values = { ...values, ...newValues };

          this.recordValueOrigins(newValues, `${secret.config.region}:${secret.config.name}`);
        } catch (error) {
          // warn that secret is not valid JSON?
        }
      } else {
        // warn that secret is empty?
      }
    }

    debug('plugin values', values);
    debug('plugin value origins', this.valueOrigins);
    debug('plugin reload in', nextReloadIn);

    return {
      values,
      valueOrigins: this.valueOrigins,
      nextReloadIn,
    };
  };

  private createSecrets = (): AWSSecretsManagerPluginSecret[] => {
    return this.pluginOptions.secrets.map((secret) => {
      return {
        client: new SecretsManagerClient({
          region: secret.region,
        }),
        getSecretValueCommand: new GetSecretValueCommand({
          SecretId: secret.name,
        }),
        config: secret,
      };
    });
  };

  private recordValueOrigins = (values: Record<string, unknown>, origin: string) => {
    for (const key of Object.keys(values)) {
      if (this.valueOrigins[key]) {
        const last = this.valueOrigins[key][this.valueOrigins[key].length - 1];

        if (last !== origin) {
          this.valueOrigins[key] = [...this.valueOrigins[key], origin];
        }
      } else {
        this.valueOrigins[key] = [origin];
      }
    }
  };

  private getNextReloadInterval(
    secret: AWSSecretsManagerPluginSecret,
    currentNextReloadIn?: number
  ): number | undefined {
    if (typeof secret.config.reloadInterval === 'string') {
      const reloadIn = ms(secret.config.reloadInterval);

      secret.nextReloadAt = reloadIn + Date.now();

      if (currentNextReloadIn) {
        return reloadIn < currentNextReloadIn ? reloadIn : currentNextReloadIn;
      } else {
        return reloadIn;
      }
    } else if (typeof secret.config.reloadInterval === 'number') {
      secret.nextReloadAt = secret.config.reloadInterval + Date.now();

      if (currentNextReloadIn) {
        return secret.nextReloadAt < currentNextReloadIn ? secret.nextReloadAt : currentNextReloadIn;
      } else {
        return secret.nextReloadAt;
      }
    }
  }
}

export { AWSSecretsManagerPlugin };
