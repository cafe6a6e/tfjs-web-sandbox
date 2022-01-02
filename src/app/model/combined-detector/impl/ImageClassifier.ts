import { injectable } from "inversify";
import * as tf from "@tensorflow/tfjs";
import { IImageClassifier, ImageClassifierOutput } from "../IImageClassifier";

@injectable()
export class ImageClassifier implements IImageClassifier {

  private mobilenet!: tf.GraphModel;

  async load(): Promise<void> {
    // TensorFlow.js のセットアップを行う
    await tf.ready();
    console.log("  tfjs backend=", tf.getBackend());

    // MobileNetV1 モデルのセットアップを行う
    this.mobilenet = await tf.loadGraphModel(
      '/models/mobilenet/web/model.json',
    )

    // warm-up する
    await this.mobilenet.predict(tf.zeros([1, 224, 224, 3]));
  }

  async classify(input: ImageData): Promise<ImageClassifierOutput> {

    // 入力画像をモデル入力サイズ [1, 224, 224, 3] に変換する
    const inputTf = tf.tidy(() => {
      return tf.browser
        .fromPixels(input)
        .resizeBilinear([224, 224])
        .expandDims(0);
    });

    // 推論を行い、確率ベクトル [1, 1000] を取得する
    const resultTf = await this.mobilenet.predict(inputTf) as tf.Tensor;

    // 最大確率をもつラベルIDを取得する
    const argmaxTf = tf.tidy(() => resultTf.squeeze().argMax());
    
    // 実際の値を同期取得する
    const classId = argmaxTf.dataSync()[0];
    const score = resultTf.dataSync()[classId];

    // 使い終わったtensorを開放する
    inputTf.dispose();
    resultTf.dispose();
    argmaxTf.dispose();

    return { classId, score };
  }
}