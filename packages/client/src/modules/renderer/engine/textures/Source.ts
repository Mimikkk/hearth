import * as MathUtils from '../math/MathUtils.js';

let _sourceId = 0;

export class Source {
  id: number;
  uuid: string;
  data: any;
  dataReady: boolean;
  version: number;

  constructor(data: TexImageSource | OffscreenCanvas) {
    this.id = ++_sourceId;

    this.uuid = MathUtils.generateUuid();

    this.data = data;
    this.dataReady = true;

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }
}
