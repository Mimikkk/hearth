import { ImageUtils } from '../extras/ImageUtils.js';
import * as MathUtils from '../math/MathUtils.js';

let _sourceId = 0;

export class Source {
  declare ['constructor']: typeof Source;
  declare isSource: true;

  id: number;
  uuid: string;
  data: any;
  dataReady: boolean;
  version: number;

  constructor(data: TexImageSource | OffscreenCanvas) {
    this.id = ++_sourceId;

    this.uuid = MathUtils.generateUuid();

    this.data = data;
    this.dataReady = true;

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }

  toJSON(meta: any): any {
    const isRootObject = meta === undefined || typeof meta === 'string';

    if (!isRootObject && meta.images[this.uuid] !== undefined) {
      return meta.images[this.uuid];
    }

    const output = {
      uuid: this.uuid,
      url: '',
    };

    const data = this.data;

    if (data !== null) {
      let url;

      if (Array.isArray(data)) {
        // cube texture

        url = [];

        for (let i = 0, l = data.length; i < l; i++) {
          if (data[i].isDataTexture) {
            url.push(serializeImage(data[i].image));
          } else {
            url.push(serializeImage(data[i]));
          }
        }
      } else {
        // texture

        url = serializeImage(data);
      }

      //@ts-expect-error
      output.url = url;
    }

    if (!isRootObject) {
      meta.images[this.uuid] = output;
    }

    return output;
  }
}

function serializeImage(image: TexImageSource | OffscreenCanvas) {
  if (
    (typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap)
  ) {
    // default images

    return ImageUtils.getDataURL(image);
  } else {
    //@ts-expect-error
    if (image.data) {
      // images of DataTexture

      return {
        //@ts-expect-error
        data: Array.from(image.data),
        //@ts-expect-error
        width: image.width,
        //@ts-expect-error
        height: image.height,
        //@ts-expect-error
        type: image.data.constructor.name,
      };
    } else {
      console.warn('THREE.Texture: Unable to serialize Texture.');
      return {};
    }
  }
}
Source.prototype.isSource = true;
