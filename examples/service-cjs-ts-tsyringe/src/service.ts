import { singleton, inject } from 'tsyringe';
import { ConfigDug } from 'config-dug';

import { ConfigSchema } from './config';

@singleton()
class Service {
  constructor(@inject('ConfigDug') private configDug: ConfigDug<ConfigSchema>) {}

  public start(): void {
    console.log('Service started');

    setInterval(async () => {
      console.log('config', this.configDug.getConfig());
    }, 10_000);
  }
}

export { Service };
