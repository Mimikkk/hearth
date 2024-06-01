import { Cache } from './Cache.js';
import { Loader } from './Loader.ts';

export class ImageLoader<TData = any, TUrl extends string = string> extends Loader<TData, TUrl> {
  load(url: TUrl, handlers: Loader.Handlers<TData, TUrl>) {
    let uri = url as string;

    if (this.path !== undefined) uri = this.path + uri;

    uri = this.manager.resolveURL(uri);

    const scope = this;

    const cached = Cache.get(uri);

    if (cached !== undefined) {
      scope.manager.itemStart(uri);

      setTimeout(function () {
        if (onLoad) onLoad(cached);

        scope.manager.itemEnd(uri);
      }, 0);

      return cached;
    }

    const image = document.createElement('img');

    function onImageLoad() {
      removeEventListeners();

      Cache.add(uri, this);

      if (onLoad) onLoad(this);

      scope.manager.itemEnd(uri);
    }

    function onImageError(event: ErrorEvent) {
      removeEventListeners();

      handlers?.onError?.(event);

      scope.manager.itemError(uri);
      scope.manager.itemEnd(uri);
    }

    function removeEventListeners() {
      image.removeEventListener('load', onImageLoad, false);
      image.removeEventListener('error', onImageError, false);
    }

    image.addEventListener('load', onImageLoad, false);
    image.addEventListener('error', onImageError, false);

    if (uri.slice(0, 5) !== 'data:' && this.crossOrigin) image.crossOrigin = this.crossOrigin;

    scope.manager.itemStart(uri);
    image.src = uri;
    return image;
  }
}
