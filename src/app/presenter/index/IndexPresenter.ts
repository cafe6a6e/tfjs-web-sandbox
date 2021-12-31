import { inject, injectable } from "inversify";
import { TYPES } from "../../../config/dependency/types";
import { ICombinedDetector } from "../../model/combined-detector/ICombinedDetector";
import { IIndexView } from "../../view/index/IIndexView";

@injectable()
export class IndexPresenter {
  constructor(
    @inject(TYPES.CombinedDetector) private combinedDetector: ICombinedDetector,
    @inject(TYPES.IndexView) private indexView: IIndexView,
  ) {
    this.indexView.setPresenter(this);
  }

  async initialize(): Promise<void> {
    this.indexView.showLoading(true);
    await this.combinedDetector.load();
    this.indexView.showLoading(false);
  }

  async processFile(imageData: ImageData): Promise<void> {

    this.indexView.showLoading(true);

    const res = await this.combinedDetector.detctFromImage(imageData);

    this.indexView.updatePoseResult(res.pose);
    this.indexView.updateSsdResult(res.ssd);
    
    this.indexView.showLoading(false);
  }
}