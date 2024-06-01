import { AudioContextManager } from '../audio/AudioContextManager.ts';
import { FileLoader } from './FileLoader.ts';
import { Loader } from './Loader.ts';

export class AudioLoader<TUrl extends string> extends Loader<AudioBuffer, TUrl> {
  load(url: TUrl, handlers: Loader.Handlers<AudioBuffer, string>) {
    const { onLoad, onProgress, onError = console.error } = handlers;

    const loader = new FileLoader<ArrayBuffer>({
      manager: this.manager,
      responseType: 'arraybuffer',
      path: this.path,
      requestHeader: this.requestHeader,
      withCredentials: this.withCredentials,
    });

    loader.load(url, {
      onLoad: buffer => {
        try {
          const bufferCopy = buffer.slice(0);

          const context = AudioContextManager.readContext();

          context.decodeAudioData(bufferCopy, onLoad).catch(e => {
            onError(e);
            this.manager.itemError(url);
          });
        } catch (e) {
          onError(e);
          this.manager.itemError(url);
        }
      },
      onProgress,
      onError,
    });
  }
}
