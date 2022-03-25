import {injectable} from 'inversify';

@injectable()
export class WebWorkerClient {
  private worker: Worker;

  constructor() {
    this.worker = new Worker('/worker.js');
  }

  async post<REQ, RES>(uri: string, data?: REQ): Promise<RES> {
    this.worker.postMessage({
      uri: uri,
      data: data,
    });

    return new Promise((resolve, reject) => {
      this.worker.onmessage = (message) => resolve(message.data);
      this.worker.onerror = (reason) => reject(reason);
    });
  }
}
