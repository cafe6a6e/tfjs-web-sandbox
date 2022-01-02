import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { IIndexView } from "../../app/view/index/IIndexView";
import { IndexView } from "../../app/view/index/impl/IndexView";
import { IndexPresenter } from "../../app/presenter/index/IndexPresenter";
import { Main } from "../../app/Main";
import { IImageClassifier } from "../../app/model/image-classifier/IImageClassifier";
import { ImageClassifier } from "../../app/model/image-classifier/impl/ImageClassifier";
import { AiLoader } from "../../app/model/ai-loader/impl/AiLoader";
import { IAiLoader } from "../../app/model/ai-loader/IAiLoader";

const container = new Container({ defaultScope: 'Singleton' });

container.bind<Main>(TYPES.Main).to(Main);
container.bind<IAiLoader>(TYPES.AiLoader).to(AiLoader)
container.bind<IImageClassifier>(TYPES.ImageClassifier).to(ImageClassifier);
container.bind<IIndexView>(TYPES.IndexView).to(IndexView);
container.bind<IndexPresenter>(TYPES.IndexPresenter).to(IndexPresenter);

export { container }