export interface ICombinedDetectorOutput {
  pose: string
  ssd: string
}

export interface ICombinedDetector {
  detctFromImage(input: HTMLImageElement): Promise<ICombinedDetectorOutput>
}