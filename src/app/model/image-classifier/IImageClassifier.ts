export type ImageClassifierOutput = { classId: number, score: number };


export interface IImageClassifier {
  load(): Promise<void>
  classify(input: ImageData): Promise<ImageClassifierOutput>
  get modelName(): string;
}
