import 'reflect-metadata';
import { container } from 'tsyringe';

import './config';
import { Service } from './service';

(async () => {
  const theService = container.resolve(Service);

  theService.start();
})();
