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

export interface LoaderSync<T, Url extends ILoader.Url> {
  loadSync(url: Url, handlers?: LoaderSync.Handlers): T;
}

export namespace LoaderSync {
  export interface Handlers {
    onProgress?: ILoader.ProgressHandler;
    onError?: ILoader.ErrorHandler;
  }
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

export const classLoader = <
  T extends {
    Url: string | string[];
    Return: any;
    Options: any;
    Configuration: any;
  },
>(
  configure: (options?: T['Options']) => T['Configuration'],
  loadAsync: (
    url: T['Url'],
    configuration: T['Configuration'],
    handlers?: LoaderAsync.Handlers,
  ) => Promise<T['Return']>,
) =>
  class Loader
    extends classConfigurable<T['Options'], T['Configuration']>(configure)
    implements LoaderAsync<T['Return'], T['Url']>, MultiLoaderAsync<T['Return'], T['Url']>
  {
    declare static Type: T;

    async loadAsync(url: T['Url'], handlers?: LoaderAsync.Handlers): Promise<T['Return']> {
      return loadAsync(url, this.configuration, handlers);
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
