import { SRGBToLinear } from '../math/ColorManagement.js';

let _canvas: HTMLCanvasElement | undefined;

export class ImageUtils {
  static getDataURL(image: HTMLImageElement | HTMLCanvasElement | CanvasImageSource | ImageBitmap | ImageData): string {
    if (image instanceof HTMLImageElement) {
      return image.src;
    }

    let canvas;
    if (image instanceof HTMLCanvasElement) {
      canvas = image;
    } else {
      image = image as ImageBitmap | ImageData;
      if (_canvas === undefined) _canvas = document.createElement('canvas');

      _canvas.width = image.width;
      _canvas.height = image.height;

      const context = _canvas.getContext('2d')!;
      if (image instanceof ImageData) {
        context.putImageData(image, 0, 0);
      } else {
        context.drawImage(image, 0, 0, image.width, image.height);
      }

      canvas = _canvas;
    }

    return canvas.toDataURL('image/png');
  }

  static sRGBToLinear(image: ImageData): {
    data: ImageData['data'];
    width: ImageData['width'];
    height: ImageData['height'];
  };
  static sRGBToLinear(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): HTMLCanvasElement;
  static sRGBToLinear(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData):
    | HTMLCanvasElement
    | {
        data: ImageData['data'];
        width: ImageData['width'];
        height: ImageData['height'];
      } {
    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap) {
      const canvas = document.createElement('canvas');

      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, image.width, image.height);

      const imageData = context.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i++) {
        data[i] = SRGBToLinear(data[i] / 255) * 255;
      }

      context.putImageData(imageData, 0, 0);

      return canvas;
    } else if (image instanceof ImageData) {
      const data = image.data.slice(0);

      for (let i = 0; i < data.length; i++) {
        data[i] = Math.floor(SRGBToLinear(data[i] / 255) * 255);
      }

      return { data: data, width: image.width, height: image.height };
    } else {
      throw Error('engine.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.');
    }
  }
}
