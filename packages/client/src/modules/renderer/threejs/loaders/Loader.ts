import { LoadManager } from './LoadManager.js';

const loader = new LoadManager();

export abstract class Loader<TData = any, TUrl extends string = string> {
  static FallbackMaterialName: string = '__Nameless';
  manager: LoadManager;
  withCredentials: boolean;
  crossOrigin: string;
  path: string;
  resourcePath: string;
  requestHeader: Loader.RequestHeader;

  protected constructor(options?: Loader.Options) {
    this.manager = options?.manager ?? loader;
    this.crossOrigin = options?.crossOrigin ?? 'anonymous';
    this.withCredentials = options?.withCredentials ?? false;
    this.path = options?.path ?? '';
    this.resourcePath = options?.resourcePath ?? '';
    this.requestHeader = options?.requestHeader ?? {};
  }

  load(url: TUrl, handlers: Loader.Handlers<TData, TUrl>) {}

  loadAsync(url: TUrl, onProgress: Loader.OnProgress) {
    return new Promise((onLoad, onError) => this.load(url, { onLoad, onProgress, onError }));
  }

  parse(data: TData) {}
}

export namespace Loader {
  export interface Options {
    manager?: LoadManager;
    crossOrigin?: string;
    withCredentials?: boolean;
    path?: string;
    resourcePath?: string;
    requestHeader?: RequestHeader;
  }

  export interface Handlers<T, E> {
    onLoad: OnLoad<T>;
    onProgress: OnProgress;
    onError: OnError<E>;
  }

  export type RequestHeader = Record<string, string>;
  export type OnLoad<T> = (item: T) => void;
  export type OnProgress = (event: ProgressEvent) => void;
  export type OnError<E> = (error: E) => void;
}
