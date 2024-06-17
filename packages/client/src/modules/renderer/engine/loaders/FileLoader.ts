import { classLoader, LoaderAsync } from './types.js';

class ReadError extends Error {
  constructor(public response: Response) {
    super(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`);
  }
}

const read = (response: Response, handlers?: LoaderAsync.Handlers): Response => {
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

export class FileLoader<RT extends ResponseType> extends classLoader<{
  Url: string;
  Return: ResponseMap[ResponseType];
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    responseType: options?.responseType ?? FileLoaderResponse.Text,
    headers: options?.headers,
    credentials: options?.credentials ?? 'same-origin',
  }),
  async (url, configuration, handlers) => {
    const response = await fetch(url, configuration);

    return parse(read(response, handlers), configuration.responseType);
  },
) {
  constructor(options?: Options<RT>) {
    super(options);
  }

  declare configuration: Configuration<RT>;

  declare static configure: <RT extends ResponseType>(options?: Options<RT>) => Configuration<RT>;

  static configureAs<RT extends ResponseType>(
    responseType: RT,
    options?: Omit<Options, 'responseType'>,
  ): Configuration<RT> {
    const configuration = FileLoader.configure<RT>(options);
    configuration.responseType = responseType;

    return configuration;
  }

  declare static create: <RT extends ResponseType>(options?: Options<RT>) => FileLoader<RT>;

  declare loadAsync: (url: string, handlers?: LoaderAsync.Handlers) => Promise<ResponseMap[RT]>;

  declare loadAsyncMultiple: (urls: string[], handlers?: LoaderAsync.Handlers) => Promise<ResponseMap[RT][]>;

  declare static loadAsync: <RT extends ResponseType>(
    url: string,
    options?: Options<RT>,
    handlers?: LoaderAsync.Handlers,
  ) => Promise<ResponseMap[RT]>;

  declare static loadAsyncMultiple: <RT extends ResponseType>(
    urls: string[],
    options?: Options<RT>,
    handlers?: LoaderAsync.Handlers,
  ) => Promise<ResponseMap[RT][]>;
}

export const enum FileLoaderResponse {
  Buffer = 'arraybuffer',
  Blob = 'blob',
  Json = 'json',
  Text = 'text',
}

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
