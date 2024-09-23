import { classLoader, LoaderAsync } from '../../types.js';
import { parseFile, readStream } from './parseFile.js';

import { ResponseMap, ResponseType } from './parseFile.js';

export { type ResponseMap, ResponseType } from './parseFile.js';

export class FileLoader<RT extends ResponseType> extends classLoader<{
  This: FileLoader<ResponseType>;
  Url: string;
  Return: ResponseMap[ResponseType];
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    responseType: options?.responseType ?? ResponseType.Text,
    headers: options?.headers,
    credentials: options?.credentials ?? 'same-origin',
  }),
  async (url, configuration, handlers) =>
    parseFile(readStream(await fetch(url, configuration), handlers), configuration.responseType),
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

export namespace FileLoader {
  export interface Configuration<RT extends ResponseType = ResponseType> {
    responseType: RT;
    credentials: RequestCredentials;
    headers?: HeadersInit;
  }

  export type Options<RT extends ResponseType = ResponseType> = {
    responseType?: RT;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
  };
}

type Configuration<RT extends ResponseType = ResponseType> = FileLoader.Configuration<RT>;
type Options<RT extends ResponseType = ResponseType> = Partial<Configuration<RT>>;
