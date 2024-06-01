import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

export class ImageLoader<TUrl extends string = string> extends Loader {
  constructor(options?: ImageLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: ImageLoader.Handlers) {
    let uri: string = url;
    if (this.path !== undefined) uri = this.path + uri;
    uri = this.manager.resolveURL(uri);

    const scope = this;

    const cached = Cache.get(uri);

    if (cached !== undefined) {
      scope.manager.itemStart(uri);

      setTimeout(function () {
        handlers?.onLoad?.(cached);

        scope.manager.itemEnd(uri);
      }, 0);

      return cached;
    }

    const image = document.createElement('img');

    function clearListeners() {
      image.removeEventListener('load', onImageLoad, false);
      image.removeEventListener('error', onImageError, false);
    }

    function onImageLoad() {
      clearListeners();

      Cache.add(uri, this);

      handlers?.onLoad?.(this);

      scope.manager.itemEnd(uri);
    }

    function onImageError(event: ErrorEvent) {
      clearListeners();

      handlers?.onError?.(event);

      scope.manager.itemError(uri);
      scope.manager.itemEnd(uri);
    }

    image.addEventListener('load', onImageLoad, false);
    image.addEventListener('error', onImageError, false);

    if (uri.slice(0, 5) !== 'data:' && this.crossOrigin !== undefined) image.crossOrigin = this.crossOrigin;

    scope.manager.itemStart(uri);

    image.src = uri;

    return image;
  }
}

export namespace ImageLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'crossOrigin' | 'path'> {}

  export interface Handlers<T = HTMLImageElement> extends Pick<Loader.Handlers<T>, 'onLoad' | 'onError'> {}
}
