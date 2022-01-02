import { inject, injectable } from "inversify";
import { IAiLoader } from "../IAiLoader";
import * as tf from "@tensorflow/tfjs";
import { IImageClassifier } from "../../image-classifier/IImageClassifier";
import { TYPES } from "../../../../config/dependency/types";


const now = () => new Date().getTime();

@injectable()
export class AiLoader implements IAiLoader {
  constructor(
    @inject(TYPES.ImageClassifier) private imageClassifier: IImageClassifier
  ){}

  async load(): Promise<void> {
    const t00 = now();

    // TensorFlow.js のセットアップを行う
    await tf.ready();
    console.info("tfjs backend=", tf.getBackend());

    const t01 = now();

    console.info("TensorFlow.js initialized. Elapsed:", t01 - t00, "msec");

    // MobileNetV1 モデルのセットアップを行う
    await this.imageClassifier.load();
  }
}