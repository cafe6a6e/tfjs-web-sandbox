import {Main} from './app/Main';
import {container} from './config/dependency/inversify.config.main';
import {TYPES} from './config/dependency/types';

const main = container.get<Main>(TYPES.Main);

try {
  main.setup();
} catch (e) {
  alert('Error during setup.');
  console.error(e);
}
