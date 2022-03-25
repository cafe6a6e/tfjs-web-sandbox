import 'reflect-metadata';
import {Container} from 'inversify';
import {TYPES} from './types';
import {IImageClassifier} from '../../app/model/image-classifier/IImageClassifier';
import {ImageClassifier} from '../../app/model/image-classifier/impl/ImageClassifier';
import {WebWorkerMain} from '../../app/model/worker/WebWorkerMain';
import {AiLoader} from '../../app/model/ai-loader/impl/AiLoader';
import {IAiLoader} from '../../app/model/ai-loader/IAiLoader';

const container = new Container({defaultScope: 'Singleton'});

container.bind<WebWorkerMain>(TYPES.WebWorkerMain).to(WebWorkerMain);
container.bind<IAiLoader>(TYPES.AiLoader).to(AiLoader);
container.bind<IImageClassifier>(TYPES.ImageClassifier).to(ImageClassifier);

export {container as workerContainer};
