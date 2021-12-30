import { injectable } from "inversify";
import { ICombinedDetector, ICombinedDetectorOutput } from "../ICombinedDetector";

@injectable()
export class CombinedDetector implements ICombinedDetector {
  async load(): Promise<boolean> {
    console.warn("Method not implemented.");
    return true;
  }

  async detctFromImage(input: ImageData): Promise<ICombinedDetectorOutput> {
    console.warn("Method not implemented.");
    return {
      pose: 'not implemented',
      ssd: 'not implemented',
    };
  }
}