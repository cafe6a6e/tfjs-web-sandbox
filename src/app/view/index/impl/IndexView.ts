import { injectable } from "inversify";
import { IndexPresenter } from "../../../presenter/index/IndexPresenter";
import { IIndexView } from "../IIndexView";

const INPUT_IMAGE_FILE_ELEMENT_ID = "tws-file";

@injectable()
export class IndexView implements IIndexView {
  private presenter!: IndexPresenter;

  // DOM elements
  private toggleElement!: HTMLElement;
  private fileInputElement!: HTMLInputElement;
  // private  // TODO:...

  setPresenter(presenter: IndexPresenter): void {
    this.presenter = presenter;
  }

  constructor() {
    this.bindHtml()
  }

  private bindHtml(): void {
    this.fileInputElement = document.getElementById(INPUT_IMAGE_FILE_ELEMENT_ID) as HTMLInputElement;
    this.fileInputElement.addEventListener("change", async () => {
      await this.onInputFileChange();
    })
  }

  private async onInputFileChange(): Promise<boolean> {
    const files = this.fileInputElement.files;
    if (files && files.length > 0) {
      await this.presenter.processFile(files[0]);
      return true;
    }
    return false;
  }

  showLoading(toggle: boolean): void {
    console.warn("Method not implemented.");
  }
  updatePoseResult(result: string): void {
    console.warn("Method not implemented.");
  }
  updateSsdResult(result: string): void {
    console.warn("Method not implemented.");
  }
}