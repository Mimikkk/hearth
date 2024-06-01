import { AnimationClip } from '../animation/AnimationClip.ts';
import { FileLoader } from './FileLoader.js';
import { Loader } from './Loader.ts';

export class AnimationLoader<TUrl extends string> extends Loader<AnimationClip[], TUrl> {
  load(url: TUrl, { onLoad, onError, onProgress }: Loader.Handlers<AnimationClip[], string>) {
    const loader = new FileLoader<string>({
      manager: this.manager,
      path: this.path,
      requestHeader: this.requestHeader,
      withCredentials: this.withCredentials,
    });

    loader.load(url, {
      onLoad: text => {
        try {
          onLoad?.(this.parse(JSON.parse(text)));
        } catch (error) {
          onError(error);
          this.manager.itemError(url);
        }
      },
      onProgress,
      onError,
    });
  }

  parse(json: object[]): AnimationClip[] {
    const animations = [];

    for (let i = 0; i < json.length; i++) {
      const clip = AnimationClip.parse(json[i]);

      animations.push(clip);
    }

    return animations;
  }
}
