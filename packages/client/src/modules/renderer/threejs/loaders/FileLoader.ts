import type { IConfigurable, IConfigurableConstructor, LoaderAsync } from './types.js';

class ReadError extends Error {
  constructor(public response: Response) {
    super(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`);
  }
}

export const FileLoader = class<Url extends string, RT extends ResponseType = 'text'>
  implements IConfigurable<Configuration<RT>>, LoaderAsync<ResponseMap[RT], Url>
{
  static configure<RT extends ResponseType>(options?: Options<RT>): Configuration<RT> {
    return {
      responseType: options?.responseType ?? ('text' as RT),
      headers: options?.headers,
      credentials: options?.credentials ?? ('same-origin' as const),
    };
  }

  configuration: Configuration<RT>;

  constructor(options?: Options<RT>) {
    this.configuration = FileLoader.configure(options);
  }

  async loadAsync<T extends ResponseMap[RT], E = unknown>(url: Url, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const response = await fetch(url, this.configuration);

    return this.parse(this.read(response, handlers));
  }

  read<E = unknown>(response: Response, handlers?: LoaderAsync.Handlers<E>): Response {
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
  }

  parse(response: Response): ResponseMap[RT] {
    switch (this.configuration.responseType) {
      case 'arraybuffer':
        return response.arrayBuffer();
      case 'blob':
        return response.blob();
      case 'json':
        return response.json();
      default:
        return response.text();
    }
  }
} satisfies IConfigurableConstructor<Options, Configuration>;

export namespace FileLoader {
  export type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text';

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
