export interface ICombinedDetectorOutput {
  pose: string
  ssd: string
}

export interface ICombinedDetector {
  load(): Promise<boolean>
  detctFromImage(input: ImageData): Promise<ICombinedDetectorOutput>
}