import { v4 } from 'uuid';

let _sourceId = 0;

export class Source<T = any> {
  id: number;
  uuid: string;
  data: any;
  dataReady: boolean;
  version: number;

  constructor(data: T) {
    this.id = ++_sourceId;

    this.uuid = v4();

    this.data = data;
    this.dataReady = true;

    this.version = 0;
  }

  set useUpdate(value: boolean) {
    if (value) ++this.version;
  }
}
