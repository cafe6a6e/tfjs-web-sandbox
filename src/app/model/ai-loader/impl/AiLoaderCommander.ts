import {inject, injectable} from 'inversify';
import {IAiLoader} from '../IAiLoader';
import {TYPES} from '../../../../config/dependency/types';
import {WebWorkerClient} from '../../worker/WebWorkerClient';
import {WURI} from '../../worker/router';


@injectable()
export class AiLoaderCommander implements IAiLoader {
  constructor(
    @inject(TYPES.WebWorkerClient) private webWorkerClient: WebWorkerClient,
  ) {}

  async load(): Promise<void> {
    await this.webWorkerClient.post(WURI.aiLoader.load);
  }
}
