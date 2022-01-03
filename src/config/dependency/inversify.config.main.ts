import 'reflect-metadata';
import {Container} from 'inversify';
import {TYPES} from './types';
import {IIndexView} from '../../app/view/index/IIndexView';
import {IndexView} from '../../app/view/index/impl/IndexView';
import {IndexPresenter} from '../../app/presenter/index/IndexPresenter';
import {Main} from '../../app/Main';
import {IImageClassifier} from '../../app/model/image-classifier/IImageClassifier';
import {IAiLoader} from '../../app/model/ai-loader/IAiLoader';
import {AiLoaderCommander} from '../../app/model/ai-loader/impl/AiLoaderCommander';
import {ImageClassifierCommander} from '../../app/model/image-classifier/impl/ImageClassifierCommander';
import {WebWorkerClient} from '../../app/model/worker/WebWorkerClient';

const container = new Container({defaultScope: 'Singleton'});

container.bind<Main>(TYPES.Main).to(Main);
container.bind<WebWorkerClient>(TYPES.WebWorkerClient).to(WebWorkerClient);
container.bind<IAiLoader>(TYPES.AiLoader).to(AiLoaderCommander);
container.bind<IImageClassifier>(TYPES.ImageClassifier).to(ImageClassifierCommander);
container.bind<IIndexView>(TYPES.IndexView).to(IndexView);
container.bind<IndexPresenter>(TYPES.IndexPresenter).to(IndexPresenter);

export {container};
