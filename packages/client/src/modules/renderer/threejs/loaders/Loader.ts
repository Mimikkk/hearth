import { LoadManager } from './LoadManager.js';

const loader = new LoadManager();

export abstract class Loader<TData = any, TUrl extends string = string> {
  static FallbackMaterialName: string = '__Nameless';
  withCredentials: boolean;
  crossOrigin: string;
  path: string;
  resourcePath: string;
  requestHeader: Loader.RequestHeader;

  protected constructor(
    public manager: LoadManager = loader,
    options?: Loader.Options,
  ) {
    this.crossOrigin = options?.crossOrigin ?? 'anonymous';
    this.withCredentials = options?.withCredentials ?? false;
    this.path = options?.path ?? '';
    this.resourcePath = options?.resourcePath ?? '';
    this.requestHeader = options?.requestHeader ?? {};
  }

  load(url: TUrl, onLoad: Loader.OnLoad<TData>, onProgress?: Loader.OnProgress, onError?: Loader.OnError<unknown>) {}

  loadAsync(url: TUrl, onProgress: Loader.OnProgress) {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, onProgress, reject);
    });
  }

  parse(data: TData) {}

  setCrossOrigin(crossOrigin: string) {
    this.crossOrigin = crossOrigin;
    return this;
  }

  setWithCredentials(value: boolean) {
    this.withCredentials = value;
    return this;
  }

  setPath(path: string) {
    this.path = path;
    return this;
  }

  setResourcePath(resourcePath: string) {
    this.resourcePath = resourcePath;
    return this;
  }

  setRequestHeader(requestHeader: Loader.RequestHeader) {
    this.requestHeader = requestHeader;
    return this;
  }
}

export namespace Loader {
  export interface Options {
    crossOrigin?: string;
    withCredentials?: boolean;
    path?: string;
    resourcePath?: string;
    requestHeader?: RequestHeader;
  }

  export type RequestHeader = Record<string, string>;
  export type OnLoad<T> = (item: T) => void;
  export type OnProgress = (event: ProgressEvent) => void;
  export type OnError<E> = (error: E) => void;
}
