import { injectable } from "inversify";
import { ICombinedDetector, ICombinedDetectorOutput } from "../ICombinedDetector";

@injectable()
export class CombinedDetector implements ICombinedDetector {
  detctFromImage(input: HTMLImageElement): Promise<ICombinedDetectorOutput> {
    throw new Error("Method not implemented.");
  }
}