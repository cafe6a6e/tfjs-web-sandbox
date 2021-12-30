import { IndexPresenter } from "../../presenter/index/IndexPresenter";

export interface IIndexView {
  setPresenter(presenter: IndexPresenter): void
  showLoading(toggle: boolean): void
  updatePoseResult(result: string): void
  updateSsdResult(result: string): void
}