import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { GPUFeature } from '@modules/renderer/engine/hearth/constants.js';

export class HearthTimestamp extends HearthComponent {
  meter(key: object, to: GPURenderPassDescriptor | GPUComputePassDescriptor): void {
    if (!this.allowed) return;

    if (this.queries.has(key)) return;
    const query = TimestampQuery.fromDevice(this.hearth.device);
    this.queries.set(key, query);

    to.timestampWrites = { querySet: query.set, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 };
  }

  encode(key: object, encoder: GPUCommandEncoder) {
    if (!this.allowed) return;

    const query = this.queries.get(key);
    if (!query) return;

    const size = 2 * BigInt64Array.BYTES_PER_ELEMENT;

    let buffers = this.buffers.get(key);

    if (!buffers) {
      buffers = TimestampBuffers.fromDevice(this.hearth.device);
      this.buffers.set(key, buffers);
    }

    const { resolve, times } = buffers;

    encoder.resolveQuerySet(query.set, 0, 2, resolve, 0);
    encoder.copyBufferToBuffer(resolve, 0, times, 0, size);
  }

  async resolve(key: object, type: 'render' | 'compute') {
    if (!this.allowed) return;

    const buffers = this.buffers.get(key);
    if (!buffers) return;

    const { times } = buffers;

    await times.mapAsync(GPUMapMode.READ);

    const [start, end] = new BigUint64Array(times.getMappedRange());
    const duration = Number(end - start) / 1000000;

    this.hearth.stats.stamp(type, duration);
    times.unmap();
  }

  get allowed() {
    return this.hearth.hasFeature(GPUFeature.TimestampQuery) && this.hearth.parameters.useTimestamp;
  }

  buffers = new WeakMap<object, TimestampBuffers>();
  queries = new WeakMap<object, TimestampQuery>();
}

class TimestampBuffers {
  constructor(
    public resolve: GPUBuffer,
    public times: GPUBuffer,
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
}

class TimestampQuery {
  constructor(public set: GPUQuerySet) {}

  static fromDevice(device: GPUDevice) {
    return new TimestampQuery(device.createQuerySet({ type: 'timestamp', count: 2 }));
  }
}
