import { inject, injectable } from "inversify";
import { TYPES } from "../../../config/dependency/types";
import { file2imageElement, UnsupportedFileTypeError } from "../../../util/file-converter";
import { ICombinedDetector } from "../../model/combined-detector/ICombinedDetector";
import { IIndexView } from "../../view/index/IIndexView";

@injectable()
export class IndexPresenter {
  constructor(
    @inject(TYPES.CombinedDetector) private combinedDetector: ICombinedDetector,
    @inject(TYPES.IndexView) private indexView: IIndexView,
  ) {}

  async processFile(file: File): Promise<void> {
    const imageElement = file2imageElement(file);

    if (imageElement instanceof UnsupportedFileTypeError) return;

    this.indexView.showLoading(true);

    const res = await this.combinedDetector.detctFromImage(imageElement);

    this.indexView.updatePoseResult(res.pose);
    this.indexView.updateSsdResult(res.ssd);
    
    this.indexView.showLoading(false);
  }
}