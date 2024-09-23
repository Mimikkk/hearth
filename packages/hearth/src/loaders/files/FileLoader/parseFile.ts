import { LoaderAsync } from '../../types.js';

export const enum ResponseType {
  Buffer = 'arraybuffer',
  Blob = 'blob',
  Json = 'json',
  Text = 'text',
}

export interface ResponseMap {
  [ResponseType.Buffer]: ArrayBuffer;
  [ResponseType.Blob]: Blob;
  [ResponseType.Json]: any;
  [ResponseType.Text]: string;
}

class ReadError extends Error {
  constructor(public response: Response) {
    super(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`);
  }
}

export const readStream = (response: Response, handlers?: LoaderAsync.Handlers): Response => {
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

export const parseFile = <RT extends ResponseType>(response: Response, responseType: RT): ResponseMap[RT] => {
  switch (responseType) {
    case ResponseType.Buffer:
      return response.arrayBuffer();
    case ResponseType.Blob:
      return response.blob();
    case ResponseType.Json:
      return response.json();
    default:
      return response.text();
  }
};
