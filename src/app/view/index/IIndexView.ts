import {IndexPresenter} from '../../presenter/index/IndexPresenter';

export interface IIndexView {
  setPresenter(presenter: IndexPresenter): void
  showLoading(toggle: boolean): void
  updateResult(result: string): void
}
