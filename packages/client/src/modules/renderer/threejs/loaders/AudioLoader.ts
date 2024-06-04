import { AudioContextManager } from '../audio/AudioContextManager.js';
import { RFileLoader } from './RFileLoader.js';
import { Loader } from './Loader.js';

export class AudioLoader<TUrl extends string = string> extends Loader<any, TUrl> {
  responseType: 'arraybuffer' = 'arraybuffer';

  constructor(options?: AudioLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: Loader.Handlers<AudioBuffer>) {
    RFileLoader.load(url, this, {
      onLoad: this.createOnLoad(url, handlers?.onLoad, handlers?.onError),
      onProgress: handlers?.onProgress,
      onError: handlers?.onError,
    });
  }

  createOnLoad(url: TUrl, onLoad: undefined | Loader.OnLoad<any>, onError: Loader.OnError<any> = console.error) {
    return (buffer: ArrayBuffer) => {
      try {
        AudioContextManager.readContext().decodeAudioData(buffer.slice(0), onLoad);
      } catch (e) {
        onError(e);
        this.manager.itemError(url);
      }
    };
  }
}

export namespace AudioLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'withCredentials' | 'path' | 'requestHeader'> {}
}
