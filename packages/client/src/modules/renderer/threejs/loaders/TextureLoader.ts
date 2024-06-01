import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.js';
import { Loader } from './Loader.js';

export class TextureLoader<TUrl extends string = string> extends Loader {
  constructor(options?: ImageLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: ImageLoader.Handlers<Texture>) {
    //@ts-expect-error
    const texture = new Texture();

    new ImageLoader(this).load(url, {
      onLoad: this.createOnLoad(texture, handlers?.onLoad),
      onError: handlers?.onError,
    });

    return texture;
  }

  createOnLoad(texture: Texture, onLoad?: Loader.OnLoad<Texture>) {
    return (image: HTMLImageElement) => {
      texture.image = image;
      texture.needsUpdate = true;

      onLoad?.(texture);
    };
  }
}
