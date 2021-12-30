import "reflect-metadata";
import { Container } from "inversify";
import { ICombinedDetector } from "../../app/model/combined-detector/ICombinedDetector";
import { TYPES } from "./types";
import { CombinedDetector } from "../../app/model/combined-detector/impl/CombinedDetector";
import { IIndexView } from "../../app/view/index/IIndexView";
import { IndexView } from "../../app/view/index/impl/IndexView";
import { IndexPresenter } from "../../app/presenter/index/IndexPresenter";
import { Main } from "../../app/Main";

const container = new Container({ defaultScope: 'Singleton' });

container.bind<Main>(TYPES.Main).to(Main);
container.bind<ICombinedDetector>(TYPES.CombinedDetector).to(CombinedDetector);
container.bind<IIndexView>(TYPES.IndexView).to(IndexView);
container.bind<IndexPresenter>(TYPES.IndexPresenter).to(IndexPresenter);

export { container }