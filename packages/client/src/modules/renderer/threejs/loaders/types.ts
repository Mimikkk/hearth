export interface ConfigurableConstructor<O, C> {
  configure(options?: O): C;

  new (options?: O): void;
}

export interface Configurable<C> {
  configuration: C;
}

export namespace ILoader {
  export interface Options extends Record<PropertyKey, any> {}

  export type Url = string | string[];
  export type ProgressHandler = (event: ProgressEvent) => void;
  export type ErrorHandler<E = unknown> = (error: E) => void;
}

export interface LoaderSync<TUrl extends ILoader.Url> {
  loadSync<T, E = unknown>(url: TUrl, handlers?: LoaderSync.Handlers<E>): T;
}

export namespace LoaderSync {
  export interface Handlers<E = unknown> {
    onProgress?: ILoader.ProgressHandler;
    onError?: ILoader.ErrorHandler<E>;
  }
}

export interface LoaderAsync<TData, TUrl extends ILoader.Url> {
  loadAsync<T extends TData, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T>;
}

export interface MultiLoaderAsync<TData, TUrl extends ILoader.Url> {
  loadAsyncMultiple<T extends TData, E = unknown>(url: TUrl[], handlers?: LoaderAsync.Handlers<E>): Promise<T[]>;
}

export namespace LoaderAsync {
  export interface Handlers<E = unknown> {
    onProgress?: ILoader.ProgressHandler;
    onError?: ILoader.ErrorHandler<E>;
  }
}

export type ConfigFn = <O, C>(options?: Partial<O>) => C;
