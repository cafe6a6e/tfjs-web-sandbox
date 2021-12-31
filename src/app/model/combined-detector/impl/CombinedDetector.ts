import { injectable } from "inversify";
import { ICombinedDetector, ICombinedDetectorOutput } from "../ICombinedDetector";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";

@injectable()
export class CombinedDetector implements ICombinedDetector {

  private poseNet: posenet.PoseNet | undefined;
  private mobileNet: mobilenet.MobileNet | undefined;

  async load(): Promise<boolean> {
    console.log("tfjs prep start.")
    // prepare tfjs
    await tf.ready();
    console.log("  tfjs backend=", tf.getBackend());

    // prepare posenet
    this.poseNet = await posenet.load({
      architecture: "MobileNetV1",
      inputResolution: { width: 320, height: 240 },
      // multiplier: 0.75,
      // quantBytes: 2,
      outputStride: 16,
      // modelUrl: 'models/posenet/1.0.0/model-stride16.json',
    })

    // prepare mobilenet
    this.mobileNet = await mobilenet.load({
      version: 1,
      alpha: 0.75,
    })

    if (!this.poseNet) {
      console.warn("  failed to load posenet model.");
      return false;
    } else {
      // warm up
      await this.poseNet.estimateMultiplePoses(tf.zeros([320, 240, 3]));
    }

    if (!this.mobileNet) {
      console.warn("  failed to load mobilenet model.");
      return false;
    } else {
      // warm up
      await this.mobileNet.classify(tf.zeros([320, 240, 3]));
    }

    console.log("tfjs prep finished.")
    return true;
  }

  async detctFromImage(input: ImageData): Promise<ICombinedDetectorOutput> {
    const posenetResult = this.poseNet ? await this.poseNet.estimateMultiplePoses(input) : [];
    const mobilenetResult = this.mobileNet ? await this.mobileNet.classify(input) : [];
    return {
      pose: posenetResult.reduce((prev, curr) => prev + `${curr.score.toFixed(2)}; `, ""),
      ssd: mobilenetResult.reduce((prev, curr) => prev + `${curr.className}(${curr.probability.toFixed(2)});`, ""),
    };
  }
}