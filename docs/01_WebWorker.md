## 記事の目的

[ニューラルポケット株式会社](https://www.neuralpocket.com/) 技術戦略部の見上です。

[前回の記事](https://qiita.com/Cafebabe_TimeLapse/items/4526a0b1f3ab234cfa93)に引き続き、AIモデルを組込んだWebアプリの性能改善についての実践的な話題になります。

以下のテーマで整理をしていきます。

<span>0.</span> <a href="https://qiita.com/Cafebabe_TimeLapse/items/4526a0b1f3ab234cfa93">TensorFlow.js を拡張性を意識して Model-View-Presenterデザインパターンの中に取り込む</a>
1. ブラウザ上のAI推論タスクを Web Worker でUIスレッドと分離する
2. AIモデルを IndexedDB でブラウザにキャッシュする
3. TensorFlow.js + WASM でCPU環境でも高速にAI推論タスクを行う


本記事は、 1. の内容に当たります。

## 前提知識

- [前回の記事](https://qiita.com/Cafebabe_TimeLapse/items/4526a0b1f3ab234cfa93)の続きになります
- Promise や async/await など JavaScript の非同期処理

## この記事の目的

前回、とりあえず TensorFlow.js でAI推論処理が動作するWebアプリを作りましたが、性能面で3つほど課題があることを述べました。そのうち

> 課題1. 画面の初回ロード中や、推論中に、ローディングアニメーションが、カクついてしまう。

この課題の解決が、本記事の目的になります。
なるべく実践的な記事になるよう、拡張性や保守性を考慮して設計を工夫することも目指そうと思います。

## UI処理が阻害される原因

TensorFlow.jsを使って行う推論タスクや、AIモデルのロードはブラウザのCPU計算リソースを多く消費します。
JavaScript はふつう単一スレッドで動作するので、CPUネックな処理と、UIの描画処理が同時に要求された場合、それらが並列に足並みを揃えて処理されていきます。

より具体的に、前回のシーケンス図を使って問題を明確にしてみます。

![01_sequence_old.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/108026/c0794d74-9d0b-9a51-c302-b3cdb51f731d.png)


Webアプリにアクセスした際、コンテンツサーバから AIモデルファイルを含む静的コンテンツを取得し、それを UIスレッドで初期化します。
このとき、UIスレッドでは

- 取得したAIモデルファイルをメモリにロードし、初期化する (上図のオレンジのライン)
- 待機しているユーザのためにローディングアニメーションを描画する (上図の青色のライン)

という処理が2つ走ります。それらが足並みを揃えて並列実行されるので、前者の重いロード処理に引っ張られて、後者の描画処理が滑らかに動かないわけです。

画像をアップロードして推論結果を取得する処理も同様で、CPUネックな推論処理と、ローディング描画が同時にUIスレッドで実行されるので、描画処理は阻害されてしまいます。


## Web Worker の基本

この課題の解決のために Web Worker を導入します。
Web Worker は、 単一スレッドで処理されるJavaScriptの問題を解消するための仕様であり、一言でいうと **CPUネックなタスクを別スレッドでバックグラウンド実行することを可能にする機構** です。

Web Worker スレッドを起動するには、メインスレッド側にて

```typescript
const myWorker = new Worker('worker.js');
```

のように、 `Worker()` コンストラクタを呼び出します。こうして生成された `Worker` オブジェクトを専用ワーカー ([Dedicated Worker](https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API)) と呼びます。
※ WebWorker にも複数あり、iframeなど複数のwindow間で共有される [Shared Worker](https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API) 等、他にもいろいろなワーカーが存在しますが、この記事では Dedicated Worker だけを扱います。

メインスレッドと専用ワーカーの間は、`postMessage` メソッドと `onmessage`, `onerror` イベントハンドラを使ってメッセージングによってやり取りします。
単純な例として、「入力した数値を2倍にする」という処理を専用ワーカーで実行する場合、まずメインスレッド側で

```typescript
// main.ts

// 専用ワーカーを生成する
const myWorker = new Worker('worker.js');

// 専用ワーカーからデータが返された時のイベント処理を登録する
myWorker.onmessage = function(evt) {
  const result = evt.data;
  console.log('Returned value', result);
}

// 専用ワーカーで実行時エラーが発生した場合のイベント処理を登録する
myWorker.onerror = function(err) {
  console.error('Error in worker thread.', err);
}

// 専用ワーカーにメッセージを送信する
myWorker.postMessage(10);
```
このように、専用ワーカーを定義して、「専用ワーカーからメッセージを受け取ったときの処理」と「専用ワーカーでエラーが発生した時の処理」を予め登録します。そうして `postMessage()` メソッドで実際に専用ワーカーに指示を送ります。

専用ワーカー側は、メッセージを受け取って行いたい処理を、 `message`イベントリスナーとして登録します。

```typescript
// worker.ts


const ctx: Worker = self as any;

ctx.addEventListener(
    'message',
    (evt) => {
      // メインスレッドから送信されたデータ(数値)を2倍にする
      const input = evt.data;
      const output = 2 * input;

      // メインスレッドに結果を送り返す
      postMessage(output);
    },
);
```

ここでコールバック関数の引数 `evt` は [MessageEvent](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent)オブジェクトであり、`data`プロパティにデータが格納される仕様になっています。

注意しなければならないのは、メインスレッドと専用ワーカーの間でやり取りできるデータは、シリアライズ可能なデータだけである点です。従って、**メインスレッド側が持つDOM要素を直接 Web Worker から参照することができません。** 当然 `window` オブジェクト等のグローバルスコープのデータも共有できません。すべてのデータは`data`プロパティに格納して送信する必要があります。

また、実行コンテキストも微妙に異なっており、メインスレッドで参照できる `Window` オブジェクトのメソッドのうち、専用ワーカーで利用できないAPIも存在します(気になる方は[ワーカーで使用できる関数やクラス](https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers)を見てみてください)。それゆえ、3rdパーティライブラリによっては WebWorker スレッドで機能しないライブラリも多数存在します。幸い TensorFlow.js は WebWorker に対応しています。

なお、Web Worker 自体は、Internet Explorer 10 にも実装されており、それなりに枯れた仕様なのですが、TensorFlow.js が WebWorker に対応したのは 2019年9月です。意外と最近ですね。(参考: [Webworker in TensorFlow.js](https://medium.com/@wl1508/webworker-in-tensorflowjs-49a306ed60aa))


さて、Web Worker の概要がわかったので、先程のシーケンス図を改善してみましょう。

## Web Worker を使ったシーケンス改善

さて、AIモデルのロードと推論処理を、 専用ワーカースレッドで実行したいわけです。
そこで、スレッドを、UI Thread (メインスレッド) と、 WebWorker Thread (専用ワーカースレッド) の２つに分けます。
※ 以下では メインスレッドを UI Thread, 専用ワーカースレッドを WebWorker Thread と呼びます

![01_sequence.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/108026/55837b80-5855-09f6-2b54-fddb9edb620b.png)


UI描画処理 (図中の青いライン) は UI Thread で実行し、CPUネックなAI処理(図中のオレンジのライン) は WebWorker Thread で実行していることがポイントです。

すでに述べたように、UI Thread と WebWorker Thread の間は、シリアライズ可能なデータでやり取りする必要があります。
そこで、推論の入力画像は UI Thread 側で DOM形式から[ImageData形式](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData)に変換して渡しています。

## Web Worker メッセージングの Promise化

Web Worker は、先に整理したように `onmessage` と `onerror` コールバック関数を登録することでイベント駆動で動作するような実装イメージになっています。
ただ、そのままだと同期処理を実装する上では使いづらいですので、同期処理のイメージで実装できるように Web Worker クライアント部品を作ってみましょう。

```typescript
// file path: app/model/worker/WebWorkerClient.ts

import {injectable} from 'inversify';

@injectable()
export class WebWorkerClient {
  private worker: Worker;

  constructor() {
    // 専用ワーカースレッドを生成する
    this.worker = new Worker('/worker.js');
  }

  async post<REQ, RES>(uri: string, data?: REQ): Promise<RES> {
    // 専用ワーカースレッドにメッセージをpostする。
    // uri: 専用ワーカー側で行う処理を区別するための URI
    // data: 専用ワーカーへの入力データ
    this.worker.postMessage({
      uri: uri,
      data: data,
    });

    return new Promise((resolve, reject) => {
      // 専用ワーカー側で処理が終わったら、その結果を、後続処理に同期的に渡す
      this.worker.onmessage = (message: MessageEvent) => resolve(message.data);

      // 専用ワーカー側でエラーが発生したら、そのエラーデータを、後続のエラー処理に渡す
      this.worker.onerror = (reason) => reject(reason);
    });
  }
}
```

この Web Worker クライアント部品は、UI Thread側で以下のようにして使う事ができます。

```typescript
// main.ts

const client = WebWorkerClient();

const result = await client.post({
  uri: "twice_it",
  data: 10
});

console.log("result =", result);
// result = 20
```

こちらのほうが、直感的に同期的に処理が記述できて便利になると思います。

このとき worker側は、以下のように実装するイメージです。
UI Threadからのメッセージに含まれる `uri` 文字列で、WebWorker Thread側で処理する内容を分岐する方針で、実装しています。

```typescript
// worker.ts


const ctx: Worker = self as any;

ctx.addEventListener(
    'message',
    (evt) => {
      const uri = evt.data.uri;

      switch(uri) {
        case 'twice_it':
          // メインスレッドから送信されたデータ(数値)を2倍にする
          const input = evt.data.data;
          const output = 2 * input;

          // メインスレッドに結果を送り返す
          postMessage(output);
          break;
        default:
          throw Error(`Invalid web-worker call: ${uri}`);
      }
    },
);

```


## Web Worker を使ったソフトウェア・アーキテクチャの改善

以上の設計方針と、Web Worker クライアント部品を使って、AI部分を改善すべく、クラス設計を修正してみましょう。

前回の Model-View-Presenter アーキテクチャでいうと Model部分が変更になるのですが、PresenterからみたModelの振る舞いは何も変わらないので、Modelのインターフェイス
(`IImageClassifier`と`IAiLoader`インターフェイス)は変更の必要はありません。

変更が必要なのはModelの実装クラス (`ImageClassifier` と `AiLoader` クラス) です。
現状は、UI Thread側ですべて処理されてしまっているところを、

- [UI Thread側の処理] Presenterから依頼された処理を、`WebWorkerClient.post()` によって、専用ワーカースレッドに処理を指示する
- [WebWorker Thread側の処理] 指示されたタスクを実行する

と指示役、タスク実行役の２つの実装クラスに分解します。前者は指示役(Commander)と呼ぶことにします。 `ImageClassifier`と`AiLoader`に対応する指示役 `ImageClassifierCommander` と `AiLoaderCommander` の2つができるイメージです。

そうすると、Model部分が、指示役、タスク実行役によって、別々のスレッドで実行される形に分離できます。
指示役 Commander は、単に WebWorker 側に指示するだけですから、先の `WebWorkerClient` 部品を使って以下のようにかけます。

- AiLoader 指示役クラス

```typescript
// file path: app/model/ai-loader/impl/AiLoaderCommander.ts

import {inject, injectable} from 'inversify';
import {IAiLoader} from '../IAiLoader';
import {TYPES} from '../../../../config/dependency/types';
import {WebWorkerClient} from '../../worker/WebWorkerClient';


@injectable()
export class AiLoaderCommander implements IAiLoader {
  constructor(
    @inject(TYPES.WebWorkerClient) private webWorkerClient: WebWorkerClient,
  ) {}

  async load(): Promise<void> {
    await this.webWorkerClient.post("aiLoader.load");
  }
}

```

- ImageClassifier 指示役クラス

```typescript
// app/model/image-classifier/impl/ImageClassifierCommander.ts

import {inject, injectable} from 'inversify';
import {IImageClassifier, ImageClassifierOutput} from '../IImageClassifier';
import {TYPES} from '../../../../config/dependency/types';
import {WebWorkerClient} from '../../worker/WebWorkerClient';


@injectable()
export class ImageClassifierCommander implements IImageClassifier {
  constructor(
    @inject(TYPES.WebWorkerClient) private webWorkerClient: WebWorkerClient,
  ) {}

  // ImageClassifier の初期化は、WebWorker スレッドにて AiLoaderから初期化指示される。
  // そのためメインスレッドから load() メソッドは呼ばれない。
  async load(): Promise<void> {
    throw Error('No need to implement.');
  }

  async classify(input: ImageData): Promise<ImageClassifierOutput> {
    return this.webWorkerClient.post('imageClassifier.classify', input);
  }
}
```

UI Thread側では、これらの指示役クラス `ImageClassifierCommander`と`AiLoaderCommander`を、`ImageClassifier`と`AiLoader`の代わりにDIコンテナに差し替え登録するだけですみます。I/Fを保った恩恵ですね。


次に、WebWorker 側の実装です。WebWorker側は、UI Threadの指示役からのメッセージを受け取り、実行役である`ImageClassifier`または`AiLoader`の処理を実行するのですが、
指示役から受け取るメッセージの `uri` に応じて、呼び出す実行役を決める必要があります。ちょうど画面遷移のルーティングのようなイメージです。
アプリが複雑になればなるほど複雑になる部分なので、工夫として役割分離します。

まず `uri` に応じて処理を振り分ける `WebWorkerMain` クラスを以下のように作って、

```typescript
// file path: app/model/worker/WebWorkerMain.ts


import {inject, injectable} from 'inversify';
import {TYPES} from '../../../config/dependency/types';
import {IAiLoader} from '../ai-loader/IAiLoader';
import {IImageClassifier} from '../image-classifier/IImageClassifier';


@injectable()
export class WebWorkerMain {
  constructor(
    @inject(TYPES.AiLoader) private aiLoader: IAiLoader,
    @inject(TYPES.ImageClassifier) private imageClassifier: IImageClassifier,
  ) {}

  async call(uri: string, data: any) {
    switch (uri) {
      case 'imageClassifier.classify': {
        return this.imageClassifier.classify(data as ImageData);
      }
      case 'aiLoader.load':
        return this.aiLoader.load();
      default:
        console.error('Invalid web-worker call:', uri);
        return;
    }
  }
}

```

WebWorker Thread のエントリーとなる `worker.ts` で、Web Worker の `message`イベントリスナーを以下のように登録するようにします。


```typescript
// file path: worker.ts


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

```

こうすることで、エントリファイル `worker.ts` から、`uri`ルーティングの機能を分離でき、将来の肥大化を防ぐことができます。

以上、ここで行った修正の結果、クラス図は以下のように変更されました。繰り返しになりますが、

- Presenterからみた Model部分(AiLoader, ImageClassifier) のI/F変更をせずにすんでいる
- UI ThreadからWebWorker Threadへのメッセージング部分が、`WebWorkerClient`部品と、ルーティングを担う`WebWorkerMain`で隠蔽化されている

ことが、設計の工夫ポイントになります。

![01_software_architecture.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/108026/757d14ba-d9a9-d09e-543d-9d9db39cd31c.png)



## ビルドについての補足

最後に、Web Worker スレッドを生成するためには、UIスレッド用の`index.js`とは別に、WebWorkerスレッド用の`worker.js`ファイルもビルドする必要ありますので、ビルドの仕方に若干の変更が必要です。
それぞれのエントリファイル`index.ts`と`worker.ts`に対して、ビルドを行えるように、以下のような`package.json`にすると良いかなと思います。


```javascript
{
  "name": "tfjs-web-sandbox",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "yarn build:main && yarn build:worker",
    "build:main": "esbuild --bundle ./src/index.ts --outfile=./www/index.js",
    "build:worker": "esbuild --bundle ./src/worker.ts --outfile=./www/worker.js",
    "start": "yarn build --servedir=./www"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.8.1",
    "@typescript-eslint/parser": "^5.8.1",
    "esbuild": "^0.14.9",
    "eslint": "^8.6.0",
    "eslint-config-google": "^0.14.0",
    "typescript": "^4.4.4"
  },
  "dependencies": {
    "@tensorflow/tfjs": "^3.12.0",
    "inversify": "^6.0.1",
    "reflect-metadata": "^0.1.13"
  }
}

```

## この記事のまとめ

以上、長くなってしまいましたが、
本記事では、TensorFlow.js のAIモデルロードと推論処理タスクの処理部を、 WebWorker でバックグラウンド実行されるようにし、UIスレッドを阻害しないようにアプリを改善しました。

WebWorker に依存する実装は共通部品化で極力隠蔽して実装をシンプルになるように工夫してみました。
また、Model部分のI/Fと実装の分離を活用して、Model-View-Presenterの設計思想を保ち最低限の改修コストで WebWorkerを導入したことも、設計上の工夫点です。

実際、今回紹介した設計方針によって、[前回の実装](https://qiita.com/Cafebabe_TimeLapse/items/4526a0b1f3ab234cfa93) からの差分は以下だけですみました。

- `WebWorkerClient` 部品の導入
- `WebWorkerMain` と `***Commander` の定義
- エントリファイル`index.ts`と`worker.ts`の分離とDI定義の変更

次回は、IndexedDBを使ったAIモデルのオフラインキャッシュを活用して、Webモデルの初回ロードの高速化を図ります。


## 参考文献

- [Web Worker API](https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API/Using_web_workers)
- [JavaScript Promise の本](https://azu.github.io/promises-book/)
- [Webworker in TensorFlow.js](https://medium.com/@wl1508/webworker-in-tensorflowjs-49a306ed60aa)
