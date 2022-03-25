import {inject, injectable} from 'inversify';
import {IImageClassifier, ImageClassifierOutput} from '../IImageClassifier';
import {TYPES} from '../../../../config/dependency/types';
import {WebWorkerClient} from '../../worker/WebWorkerClient';
import {WURI} from '../../worker/router';


@injectable()
export class ImageClassifierCommander implements IImageClassifier {
  constructor(
    @inject(TYPES.WebWorkerClient) private webWorkerClient: WebWorkerClient,
  ) {}

  async load(): Promise<void> {
    throw Error('No need to implement.');
  }

  async classify(input: ImageData): Promise<ImageClassifierOutput> {
    return this.webWorkerClient.post(WURI.imageClassifier.classify, input);
  }
}
