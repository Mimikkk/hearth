import { AudioContextManager } from '../audio/AudioContextManager.js';
import { classLoader } from './types.ts';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

export class AudioLoader extends classLoader<{
  Url: string;
  Return: AudioBuffer;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(FileLoaderResponse.Buffer, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => {
    const buffer = await FileLoader.loadAsync(url, fileLoader, handlers);

    const context = AudioContextManager.get();

    return await context.decodeAudioData(buffer);
  },
) {}

export namespace AudioLoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Buffer>;
  }
}
type Options = AudioLoader.Options;
type Configuration = AudioLoader.Configuration;
