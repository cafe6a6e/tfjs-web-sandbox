import {WebWorkerMain} from './app/model/worker/WebWorkerMain';
import {workerContainer} from './config/dependency/inversify.config.worker';
import {TYPES} from './config/dependency/types';

const workerMain = workerContainer.get<WebWorkerMain>(TYPES.WebWorkerMain);

const ctx: Worker = self as any;

ctx.addEventListener(
    'message',
    async (e: MessageEvent<{ uri: string; data: any }>) => {
      const {uri, data} = e.data;
      const res = await workerMain.call(uri, data);
      ctx.postMessage(res);
    },
);
