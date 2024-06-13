import { AudioContextManager } from '../audio/AudioContextManager.js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from './types.ts';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

export const AudioLoader = class<TData extends AudioBuffer, TUrl extends string = string>
  implements Configurable<Configuration>, LoaderAsync<TData, TUrl>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      responseType: FileLoaderResponse.Buffer,
      credentials: options?.credentials ?? 'same-origin',
      headers: options?.headers,
    };
  }

  constructor(options?: Options) {
    this.configuration = AudioLoader.configure(options);
  }

  async loadAsync<T extends TData, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffer = await FileLoader.loadAsync(url, this.configuration, handlers);

    const context = AudioContextManager.get();
    const audio = await context.decodeAudioData(buffer);

    return audio as T;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace AudioLoader {
  export interface Options extends Omit<FileLoader.Options, 'responseType'> {}

  export interface Configuration extends Omit<FileLoader.Configuration, 'responseType'> {
    responseType: FileLoaderResponse.Buffer;
  }
}
type Options = AudioLoader.Options;
type Configuration = AudioLoader.Configuration;
