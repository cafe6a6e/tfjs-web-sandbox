export class UnsupportedFileTypeError extends Error {}

export function file2imageElement(file: File): HTMLImageElement | UnsupportedFileTypeError  {
  // TODO: implement
  return new HTMLImageElement();
}

export function dom2ImageData(imageElement: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}