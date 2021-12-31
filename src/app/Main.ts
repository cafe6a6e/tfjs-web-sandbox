import { inject, injectable } from "inversify"
import { TYPES } from "../config/dependency/types"
import { ICombinedDetector } from "./model/combined-detector/ICombinedDetector"
import { IndexPresenter } from "./presenter/index/IndexPresenter";

@injectable()
export class Main {
  constructor(
    @inject(TYPES.IndexPresenter) private indexPresenter: IndexPresenter
  ) {}

  async setup(): Promise<boolean> {
    await this.indexPresenter.initialize();
    return true;
  }
}