import { AnimationClip } from '../animation/AnimationClip.ts';
import { FileLoader } from './FileLoader.js';
import { Loader } from './Loader.ts';

export class AnimationLoader extends Loader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError = console.error) {
    const loader = new FileLoader(this.manager, {
      path: this.path,
      requestHeader: this.requestHeader,
      withCredentials: this.withCredentials,
    });

    loader.load(
      url,
      text => {
        try {
          onLoad(this.parse(JSON.parse(text)));
        } catch (error) {
          onError(error);
          this.manager.itemError(url);
        }
      },
      onProgress,
      onError,
    );
  }

  parse(json) {
    const animations = [];

    for (let i = 0; i < json.length; i++) {
      const clip = AnimationClip.parse(json[i]);

      animations.push(clip);
    }

    return animations;
  }
}
