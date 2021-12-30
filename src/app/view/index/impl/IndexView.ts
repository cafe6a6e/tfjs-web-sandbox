import { injectable } from "inversify";
import { IndexPresenter } from "../../../presenter/index/IndexPresenter";
import { IIndexView } from "../IIndexView";

@injectable()
export class IndexView implements IIndexView {
  private presenter!: IndexPresenter;

  // DOM elements
  private toggleElement!: HTMLElement;
  private fileInputElement!: HTMLInputElement;
  private  // TODO:...

  setPresenter(presenter: IndexPresenter): void {
    this.presenter = presenter;
  }

  constructor() {
    this.bindHtml()
  }

  private bindHtml(): void {

  }

  showLoading(toggle: boolean): void {
    throw new Error("Method not implemented.");
  }
  updatePoseResult(result: string): void {
    throw new Error("Method not implemented.");
  }
  updateSsdResult(result: string): void {
    throw new Error("Method not implemented.");
  }
}