import {injectable} from 'inversify';
import * as tf from '@tensorflow/tfjs';
import {IImageClassifier, ImageClassifierOutput} from '../IImageClassifier';


const now = () => new Date().getTime();

@injectable()
export class ImageClassifier implements IImageClassifier {
  private mobilenet!: tf.GraphModel;
  modelName = 'mobilenet_1.0.0';

  async load(): Promise<void> {
    const t00 = now();

    // MobileNetV1 モデルのセットアップを行う
    const localModels = await tf.io.listModels();
    const idbModelUrl = `indexeddb://${this.modelName}`;
    const webModelUrl = `/models/${this.modelName}/web/model.json`;

    // indexedDBにモデルが保存されていれば、indexedDBから読み込む。
    // そうでなければ webモデルを読み込み、indexcedDBに保存する。
    if (idbModelUrl in localModels) {
      this.mobilenet = await tf.loadGraphModel(idbModelUrl);
      console.info('model loaded from indexedDB:', idbModelUrl)
    } else {
      this.mobilenet = await tf.loadGraphModel(webModelUrl);
      console.info('web model loaded:', webModelUrl)

      await this.mobilenet.save(idbModelUrl);
      console.info('model saved in indexedDB:', idbModelUrl)
    }

    // warm-up する
    const resultTf = this.mobilenet.predict(tf.zeros([1, 224, 224, 3])) as tf.Tensor;
    resultTf.dataSync();
    resultTf.dispose();

    const t01 = now();

    console.info('MobileNetV1 initialized. Elapsed:', t01 - t00, 'msec');
  }

  async classify(input: ImageData): Promise<ImageClassifierOutput> {
    const t00 = now();

    // 入力画像をモデル入力サイズ [1, 224, 224, 3] に変換する
    const inputTf = tf.tidy(() => {
      return tf.browser
          .fromPixels(input)
          .resizeBilinear([224, 224])
          .expandDims(0);
    });

    // 推論を行い、確率ベクトル [1, 1000] を取得する
    const resultTf = this.mobilenet.predict(inputTf) as tf.Tensor;

    // 最大確率をもつラベルIDを取得する
    const argmaxTf = tf.tidy(() => resultTf.squeeze().argMax());

    // スコア値を取得する
    const classId = argmaxTf.dataSync()[0];
    const score = resultTf.dataSync()[classId];

    // 使い終わったtensorを開放する
    inputTf.dispose();
    resultTf.dispose();
    argmaxTf.dispose();

    const t01 = now();
    console.info('Inference done. Elapsed:', t01 - t00, 'msec');
    return {classId, score};
  }
}
