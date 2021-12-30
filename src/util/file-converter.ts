export class UnsupportedFileTypeError extends Error {}

export function file2imageElement(file: File): HTMLImageElement | UnsupportedFileTypeError  {
  // TODO: implement
  return new HTMLImageElement();
}

export function file2imageData(file: File): ImageData | UnsupportedFileTypeError {
  // TODO: implement
  return new ImageData(1, 1);
}