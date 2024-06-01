import { AudioContextManager } from '../audio/AudioContextManager.ts';
import { FileLoader } from './FileLoader.ts';
import { Loader } from './Loader.ts';

export class AudioLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const scope = this;

    const loader = new FileLoader({
      manager: this.manager,
      responseType: 'arraybuffer',
      path: this.path,
      requestHeader: this.requestHeader,
      withCredentials: this.withCredentials,
    });

    loader.load(
      url,
      function (buffer) {
        try {
          // Create a copy of the buffer. The `decodeAudioData` method
          // detaches the buffer when complete, preventing reuse.
          const bufferCopy = buffer.slice(0);

          const context = AudioContextManager.readContext();
          context
            .decodeAudioData(bufferCopy, function (audioBuffer) {
              onLoad(audioBuffer);
            })
            .catch(handleError);
        } catch (e) {
          handleError(e);
        }
      },
      onProgress,
      onError,
    );

    function handleError(e) {
      if (onError) {
        onError(e);
      } else {
        console.error(e);
      }

      scope.manager.itemError(url);
    }
  }
}
