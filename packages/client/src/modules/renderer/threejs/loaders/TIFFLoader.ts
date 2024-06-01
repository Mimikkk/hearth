import { DataTextureLoader, Filter } from '../../threejs/Three.js';

import * as utif from 'utif';

export class TIFFLoader extends DataTextureLoader {
  parse(buffer: ArrayBuffer) {
    const ifds = utif.decode(buffer);
    utif.decodeImage(buffer, ifds[0]);
    const rgba = utif.toRGBA8(ifds[0]);

    return {
      width: ifds[0].width,
      height: ifds[0].height,
      data: rgba,
      flipY: true,
      magFilter: Filter.Linear,
      minFilter: Filter.LinearMipmapLinear,
    };
  }
}

export namespace TIFFLoader {
  export interface Result {
    width: number;
    height: number;
    data: Uint8Array;
    flipY: boolean;
    magFilter: Filter;
    minFilter: Filter;
  }
}
