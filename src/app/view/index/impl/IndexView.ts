import {injectable} from 'inversify';
import {dom2ImageData} from '../../../../util/file-converter';
import {IndexPresenter} from '../../../presenter/index/IndexPresenter';
import {IIndexView} from '../IIndexView';

const LOADING_ELEMENT_ID = 'tws-loader';
const INPUT_IMAGE_FILE_ELEMENT_ID = 'tws-file';
const INPUT_IMAGE_ELEMENT_ID = 'tws-image';
const RESULT_DIV_ELEMENT_ID = 'tws-result';

@injectable()
export class IndexView implements IIndexView {
  private presenter!: IndexPresenter;

  // DOM elements
  private loadingElement!: HTMLDivElement;
  private fileInputElement!: HTMLInputElement;
  private inputImageElement!: HTMLImageElement;
  private resultDivElement!: HTMLDivElement;

  setPresenter(presenter: IndexPresenter): void {
    this.presenter = presenter;
  }

  constructor() {
    this.bindHtml();
  }

  private bindHtml(): void {
    // file input element
    this.fileInputElement = document.getElementById(INPUT_IMAGE_FILE_ELEMENT_ID) as HTMLInputElement;
    this.fileInputElement.addEventListener('change', async () => {
      await this.onInputFileChange();
    });

    // input image element
    this.inputImageElement = document.getElementById(INPUT_IMAGE_ELEMENT_ID) as HTMLImageElement;
    this.inputImageElement.addEventListener('load', async () => {
      await this.onInputImageLoaded();
    });

    // result div elements
    this.resultDivElement = document.getElementById(RESULT_DIV_ELEMENT_ID) as HTMLDivElement;

    // loading element
    this.loadingElement = document.getElementById(LOADING_ELEMENT_ID) as HTMLDivElement;
  }

  private async onInputFileChange(): Promise<boolean> {
    const files = this.fileInputElement.files;
    if (!files || files.length === 0) {
      return false;
    }

    const targetFile = files[0];

    if (!/\.(jpe?g|png|gif)$/i.test(targetFile.name)) {
      console.warn('unsupported file type:', targetFile.name);
      return false;
    }

    this.inputImageElement.src = window.URL.createObjectURL(targetFile);
    return true;
  }

  private async onInputImageLoaded(): Promise<boolean> {
    const inputImageData = dom2ImageData(this.inputImageElement);
    await this.presenter.processFile(inputImageData);
    return false;
  }

  showLoading(toggle: boolean): void {
    if (toggle) {
      // show
      this.loadingElement.style.visibility = 'visible';
    } else {
      // hide
      this.loadingElement.style.visibility = 'hidden';
    }
  }

  updateResult(result: string): void {
    this.resultDivElement.innerHTML = result;
  }
}
