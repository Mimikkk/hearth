import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { GPUFeature } from '@modules/renderer/engine/hearth/constants.js';

export class HearthTimestamp extends HearthComponent {
  buffers = new WeakMap<object, TimestampBuffers>();
  queries = new WeakMap<object, TimestampQuery>();

  meter(key: object, to: GPURenderPassDescriptor | GPUComputePassDescriptor): void {
    if (!this.allowed) return;

    if (this.queries.has(key)) return;
    const query = TimestampQuery.fromDevice(this.hearth.device);
    this.queries.set(key, query);

    to.timestampWrites = { querySet: query.set, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 };
  }

  encode(key: object, encoder: GPUCommandEncoder): void {
    if (!this.allowed) return;

    const query = this.queries.get(key);
    if (!query) return;

    let buffers = this.buffers.get(key);
    if (!buffers) {
      buffers = TimestampBuffers.fromDevice(this.hearth.device);
      this.buffers.set(key, buffers);
    }

    const { resolve, pending } = buffers;

    if (pending) return;

    query.encodeTransfer(encoder, resolve);
    buffers.encodeTransfer(encoder);
  }

  async resolve(key: object, type: 'render' | 'compute') {
    if (!this.allowed) return;

    const buffers = this.buffers.get(key);
    if (!buffers) return;

    if (buffers.pending) return;

    buffers.pending = true;

    const duration = await buffers.delta();
    this.hearth.stats.stamp(type, duration);

    buffers.pending = false;
  }

  get allowed() {
    return this.hearth.hasFeature(GPUFeature.TimestampQuery) && this.hearth.parameters.useTimestamp;
  }
}

class TimestampBuffers {
  constructor(
    public resolve: GPUBuffer,
    public times: GPUBuffer,
    public pending: boolean = false,
  ) {}

  static fromDevice(device: GPUDevice) {
    return new TimestampBuffers(
      device.createBuffer({
        label: 'timestamp: resolve query buffer',
        size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      }),
      device.createBuffer({
        label: 'timestamp: time buffer',
        size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      }),
    );
  }

  async delta() {
    await this.times.mapAsync(GPUMapMode.READ);
    const [start, end] = new BigUint64Array(this.times.getMappedRange());
    this.times.unmap();

    return Number(end - start) / 1000000;
  }

  encodeTransfer(encoder: GPUCommandEncoder) {
    encoder.copyBufferToBuffer(this.resolve, 0, this.times, 0, 2 * BigInt64Array.BYTES_PER_ELEMENT);
  }
}

class TimestampQuery {
  constructor(public set: GPUQuerySet) {}

  static fromDevice(device: GPUDevice) {
    return new TimestampQuery(device.createQuerySet({ type: 'timestamp', count: 2 }));
  }

  encodeTransfer(encoder: GPUCommandEncoder, into: GPUBuffer): void {
    encoder.resolveQuerySet(this.set, 0, 2, into, 0);
  }
}
