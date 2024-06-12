import type { Configurable, ConfigurableConstructor, LoaderAsync, MultiLoaderAsync } from './types.js';

class ReadError extends Error {
  constructor(public response: Response) {
    super(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`);
  }
}

const read = <E = unknown>(response: Response, handlers?: LoaderAsync.Handlers<E>): Response => {
  if (response.status !== 200 && response.status !== 0) throw new ReadError(response);
  if (!response.body) return response;
  const reader = response.body.getReader();

  const size = response.headers.get('Content-Length') || response.headers.get('X-File-Size');
  const total = size ? parseInt(size) : 0;

  const lengthComputable = total !== 0;
  let loaded = 0;

  const start = (controller: ReadableStreamDefaultController) => {
    async function load() {
      const { done, value } = await reader.read();
      if (done) return controller.close();

      loaded += value.byteLength;

      handlers?.onProgress?.(new ProgressEvent('progress', { lengthComputable, loaded, total }));

      controller.enqueue(value);
      load();
    }

    load();
  };

  return new Response(new ReadableStream({ start }));
};

const parse = <RT extends ResponseType>(response: Response, responseType: RT): ResponseMap[RT] => {
  switch (responseType) {
    case FileLoaderResponse.Buffer:
      return response.arrayBuffer();
    case FileLoaderResponse.Blob:
      return response.blob();
    case FileLoaderResponse.Json:
      return response.json();
    default:
      return response.text();
  }
};

export const FileLoader = class<Url extends string, RT extends ResponseType = FileLoaderResponse.Text>
  implements Configurable<Configuration<RT>>, LoaderAsync<ResponseMap[RT], Url>, MultiLoaderAsync<ResponseMap[RT], Url>
{
  static configure<RT extends ResponseType>(options?: Options<RT>): Configuration<RT> {
    return {
      responseType: options?.responseType ?? ('text' as RT),
      headers: options?.headers,
      credentials: options?.credentials ?? 'same-origin',
    };
  }

  configuration: Configuration<RT>;

  constructor(options?: Options<RT>) {
    this.configuration = FileLoader.configure(options);
  }

  async loadAsync<T extends ResponseMap[RT], E = unknown>(url: Url, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const response = await fetch(url, this.configuration);

    return parse(read(response, handlers), this.configuration.responseType);
  }

  async loadAsyncMultiple<T extends ResponseMap[RT], E = unknown>(
    urls: Url[],
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    return Promise.all(urls.map(url => this.loadAsync(url, handlers)));
  }

  static async loadAsync<T extends ResponseMap[RT], Url extends string, RT extends ResponseType, E = unknown>(
    url: Url,
    options?: Options<RT>,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    return new FileLoader(options).loadAsync(url, handlers);
  }

  static async loadAsyncMultiple<T extends ResponseMap[RT], Url extends string, RT extends ResponseType, E = unknown>(
    urls: Url[],
    options?: Options<RT>,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T[]> {
    return new FileLoader(options).loadAsyncMultiple(urls, handlers);
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export const enum FileLoaderResponse {
  Buffer = 'arraybuffer',
  Blob = 'blob',
  Json = 'json',
  Text = 'text',
}

export type FileLoader<Url extends string, RT extends ResponseType = FileLoaderResponse.Text> = InstanceType<
  typeof FileLoader<Url, RT>
>;
export namespace FileLoader {
  export type ResponseType = FileLoaderResponse;

  export type ResponseMap = {
    arraybuffer: ArrayBuffer;
    blob: Blob;
    json: any;
    text: string;
  };

  export interface Configuration<RT extends ResponseType = ResponseType> {
    responseType: RT;
    headers?: HeadersInit;
    credentials: RequestCredentials;
  }

  export type Options<RT extends ResponseType = ResponseType> = Partial<Configuration<RT>>;
}

type ResponseType = FileLoader.ResponseType;
type ResponseMap = FileLoader.ResponseMap;
type Configuration<RT extends ResponseType = ResponseType> = FileLoader.Configuration<RT>;
type Options<RT extends ResponseType = ResponseType> = Partial<Configuration<RT>>;
