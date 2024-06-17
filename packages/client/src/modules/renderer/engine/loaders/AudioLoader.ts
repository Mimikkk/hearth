import { AudioContextManager } from '../audio/AudioContextManager.js';
import { classLoader } from './types.ts';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';

export class AudioLoader extends classLoader<{
  Url: string;
  Return: AudioBuffer;
  Options: {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
  };
  Configuration: {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Buffer>;
  };
}>(
  options => ({ fileLoader: FileLoader.configureAs(FileLoaderResponse.Buffer, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => {
    const buffer = await FileLoader.loadAsync(url, fileLoader, handlers);

    const context = AudioContextManager.get();

    return await context.decodeAudioData(buffer);
  },
) {}

export namespace AudioLoader {
  export type Options = (typeof AudioLoader)['Type']['Options'];
  export type Configuration = (typeof AudioLoader)['Type']['Configuration'];
}
