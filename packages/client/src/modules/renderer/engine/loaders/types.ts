export type ConfigureFn<O, C> = (options?: O) => C;

export interface ConfigurableConstructor<O, C> {
  configure(options?: O): C;

  create(options?: O): InstanceType<this>;

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

export interface LoaderAsync<T, Url extends ILoader.Url> {
  loadAsync(url: Url, handlers?: LoaderAsync.Handlers): Promise<T>;
}

export interface MultiLoaderAsync<T, Url extends ILoader.Url> {
  loadAsyncMultiple(url: Url[], handlers?: LoaderAsync.Handlers): Promise<T[]>;
}

export namespace LoaderAsync {
  export interface Handlers {
    onProgress?: ILoader.ProgressHandler;
    onError?: ILoader.ErrorHandler;
  }
}

export const classConfigurable = <O, C>(configure: (options?: O) => C) =>
  class Config implements Configurable<C> {
    configuration: C;

    static configure(options?: O): C {
      return configure(options);
    }

    static create(options?: O) {
      return new this(options);
    }

    constructor(options?: O) {
      this.configuration = Config.configure(options);
    }
  } satisfies ConfigurableConstructor<O, C>;

export type LoadContext<Url extends ILoader.Url, T, C> = LoaderAsync<T, Url> &
  MultiLoaderAsync<T, Url> &
  Configurable<C> &
  any;

export type LoadFn<Url extends ILoader.Url, T, C> = (
  this: LoadContext<Url, T, C>,
  url: Url,
  configuration: C,
  handlers?: LoaderAsync.Handlers,
) => Promise<T>;

export const classLoader = <
  T extends {
    Url: ILoader.Url;
    Return: any;
    Options: any;
    Configuration: any;
  },
>(
  configure: ConfigureFn<T['Options'], T['Configuration']>,
  loadAsync: LoadFn<T['Url'], T['Return'], T['Configuration']>,
) =>
  class Loader
    extends classConfigurable<T['Options'], T['Configuration']>(configure)
    implements LoaderAsync<T['Return'], T['Url']>, MultiLoaderAsync<T['Return'], T['Url']>
  {
    declare static Type: T;
    loadAsyncFn: typeof loadAsync;

    constructor(options?: T['Options']) {
      super(options);
      this.loadAsyncFn = loadAsync.bind(this);
    }

    async loadAsync(url: T['Url'], handlers?: LoaderAsync.Handlers): Promise<T['Return']> {
      return this.loadAsyncFn(url, this.configuration, handlers);
    }

    async loadAsyncMultiple(url: T['Url'][], handlers?: LoaderAsync.Handlers): Promise<T['Return'][]> {
      return Promise.all(url.map(url => this.loadAsync(url, handlers)));
    }

    static loadAsync(url: T['Url'], options?: T['Options'], handlers?: LoaderAsync.Handlers): Promise<T['Return']> {
      return new this(options).loadAsync(url, handlers);
    }

    static loadAsyncMultiple(
      url: T['Url'][],
      options?: T['Options'],
      handlers?: LoaderAsync.Handlers,
    ): Promise<T['Return'][]> {
      return new this(options).loadAsyncMultiple(url, handlers);
    }
  };
