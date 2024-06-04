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

class ReadError extends Error {
  constructor(
    message: string,
    public response: Response,
  ) {
    super(message);
  }
}

type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text';
type ResponseMap = {
  arraybuffer: ArrayBuffer;
  blob: Blob;
  json: any;
  text: string;
};

export class RFileLoader<RT extends ResponseType = 'text', TUrl extends string = string> extends Loader<
  ResponseMap[RT],
  TUrl
> {
  responseType: RT;

  constructor(options?: RFileLoader.Options<RT>) {
    super(options);
    this.responseType = (options?.responseType ?? 'text') as RT;
  }

  parse() {}

  load(
    url: TUrl,
    onLoad?: Loader.OnLoad<ResponseMap[RT]> | Loader.Handlers<ResponseMap[RT]>,
    onProgress?: Loader.OnProgress,
    onError: Loader.OnError = console.error,
  ): void {
    if (typeof onLoad === 'object') return this.load(url, onLoad.onLoad, onLoad.onProgress, onLoad.onError);

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
      loading[uri].push({ onLoad, onProgress, onError });
      return;
    }

    loading[uri] = [];
    loading[uri].push({ onLoad, onProgress, onError });

    const request = new Request(uri, {
      headers: new Headers(this.requestHeader),
      credentials: this.withCredentials ? 'include' : 'same-origin',
    });

    // start the fetch
    fetch(request)
      .then(response => {
        if (response.status === 200 || response.status === 0) {
          if (!response.body) return response;
          const callbacks = loading[uri];
          const reader = response.body.getReader();

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
          throw new ReadError(
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

  static load<RT extends ResponseType>(
    url: string,
    options: RFileLoader.Options<RT>,
    handlers: Loader.Handlers<ResponseMap[RT]>,
  ): void {
    new RFileLoader(options).load(url, handlers);
  }
}

export namespace RFileLoader {
  export interface Options<RT extends ResponseType> extends Loader.Options {
    responseType?: RT;
  }

  export interface Handlers<T, E> {
    onLoad?: Loader.OnLoad<T>;
    onProgress?: Loader.OnProgress;
    onError?: Loader.OnError<E>;
  }
}
