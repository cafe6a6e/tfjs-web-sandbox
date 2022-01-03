import {inject, injectable} from 'inversify';
import {TYPES} from '../../../config/dependency/types';
import {IAiLoader} from '../ai-loader/IAiLoader';
import {IImageClassifier} from '../image-classifier/IImageClassifier';
import {WURI} from './router';


@injectable()
export class WebWorkerMain {
  constructor(
    @inject(TYPES.AiLoader) private aiLoader: IAiLoader,
    @inject(TYPES.ImageClassifier) private imageClassifier: IImageClassifier,
  ) {}

  async call(uri: string, data: any) {
    switch (uri) {
      case WURI.imageClassifier.classify: {
        return this.imageClassifier.classify(data as ImageData);
      }
      case WURI.aiLoader.load:
        return this.aiLoader.load();
      default:
        console.error('Invalid web-worker call:', uri);
        return;
    }
  }
}
