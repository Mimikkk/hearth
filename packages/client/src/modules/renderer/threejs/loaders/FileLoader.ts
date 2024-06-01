import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

const loading: Record<
  string,
  {
    onLoad?: Loader.OnLoad<any>;
    onProgress?: Loader.OnProgress;
    onError?: Loader.OnError<any>;
  }[]
> = {};

class HttpError extends Error {
  constructor(
    message: string,
    public response: Response,
  ) {
    super(message);
  }
}

type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text';

export class FileLoader<TData extends string | ArrayBuffer, TUrl extends string = string> extends Loader<TData, TUrl> {
  responseType: ResponseType;

  constructor(options?: FileLoader.Options) {
    super(options);
    this.responseType = options?.responseType ?? 'text';
  }

  load(url: TUrl, handlers: Loader.Handlers<TData, TUrl>) {
    const { onLoad } = handlers;
    let uri: string = url;

    if (this.path) uri = this.path + uri;

    uri = this.manager.resolveURL(uri);

    const cached = Cache.get(uri);

    if (cached !== undefined) {
      this.manager.itemStart(uri);

      setTimeout(() => {
        onLoad?.(cached);

        this.manager.itemEnd(uri);
      }, 0);

      return cached;
    }

    if (loading[uri]) {
      loading[uri].push(handlers);
      return;
    }

    loading[uri] = [];
    loading[uri].push(handlers);

    const request = new Request(uri, {
      headers: new Headers(this.requestHeader),
      credentials: this.withCredentials ? 'include' : 'same-origin',
    });

    fetch(request)
      .then(response => {
        if (response.status === 200 || response.status === 0) {
          if (!response.body) return response;

          const callbacks = loading[uri];
          const reader = response.body.getReader();

          // Nginx needs X-File-Size check
          // https://serverfault.com/questions/482875/
          // /why-does-nginx-remove-content-length-header-for-chunked-content
          const contentLength = response.headers.get('Content-Length') || response.headers.get('X-File-Size');
          const total = contentLength ? parseInt(contentLength) : 0;
          const lengthComputable = total !== 0;
          let loaded = 0;

          const stream = new ReadableStream({
            start(controller) {
              readData();

              function readData() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                  } else {
                    loaded += value.byteLength;

                    const event = new ProgressEvent('progress', { lengthComputable, loaded, total });
                    for (let i = 0, il = callbacks.length; i < il; i++) {
                      const callback = callbacks[i];
                      if (callback.onProgress) callback.onProgress(event);
                    }

                    controller.enqueue(value);
                    readData();
                  }
                });
              }
            },
          });

          return new Response(stream);
        } else {
          throw new HttpError(
            `fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`,
            response,
          );
        }
      })
      .then(response => {
        switch (this.responseType) {
          case 'arraybuffer':
            return response.arrayBuffer();
          case 'blob':
            return response.blob();
          case 'json':
            return response.json();
          default:
            return response.text();
        }
      })
      .then(data => {
        // Add to cache only on HTTP success, so that we do not cache
        // error response bodies as proper responses to requests.
        Cache.add(uri, data);

        const callbacks = loading[uri];
        delete loading[uri];

        for (let i = 0, il = callbacks.length; i < il; i++) {
          const callback = callbacks[i];
          if (callback.onLoad) callback.onLoad(data);
        }
      })
      .catch(err => {
        // Abort errors and other errors are handled the same

        const callbacks = loading[uri];

        if (callbacks === undefined) {
          // When onLoad was called and url was deleted in `loading`
          this.manager.itemError(uri);
          throw err;
        }

        delete loading[uri];

        for (let i = 0, il = callbacks.length; i < il; i++) {
          const callback = callbacks[i];
          if (callback.onError) callback.onError(err);
        }

        this.manager.itemError(uri);
      })
      .finally(() => {
        this.manager.itemEnd(uri);
      });

    this.manager.itemStart(uri);
  }
}

export namespace FileLoader {
  export interface Options extends Loader.Options {
    responseType?: ResponseType;
  }
}
