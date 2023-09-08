import {inject, injectable} from 'inversify';
import {IAiLoader} from '../IAiLoader';
import * as tf from '@tensorflow/tfjs';
import {IImageClassifier} from '../../image-classifier/IImageClassifier';
import {TYPES} from '../../../../config/dependency/types';
import {REQUIRED_MODELS} from '../../../../config/required-models';


const now = () => new Date().getTime();

@injectable()
export class AiLoader implements IAiLoader {
  constructor(
    @inject(TYPES.ImageClassifier) private imageClassifier: IImageClassifier,
  ) {}

  async load(): Promise<void> {
    // TensorFlow.js のセットアップを行う
    const t00 = now();
    await tf.ready();
    console.info('tfjs backend=', tf.getBackend());
    const t01 = now();
    console.info('TensorFlow.js initialized. Elapsed:', t01 - t00, 'msec');

    // 不必要なモデルを IndexedDB から削除する
    const localModels = await tf.io.listModels();
    const requiredIdbModelUrl = REQUIRED_MODELS.map(modelName => `indexeddb://${modelName}`);
    for (const modelUrl of Object.keys(localModels)) {
      if (requiredIdbModelUrl.includes(modelUrl)) continue;
      await tf.io.removeModel(modelUrl);
      console.info('model in indexedDB removed:', modelUrl);
    }

    // MobileNetV1 モデルのセットアップを行う
    await this.imageClassifier.load();
  }
}
