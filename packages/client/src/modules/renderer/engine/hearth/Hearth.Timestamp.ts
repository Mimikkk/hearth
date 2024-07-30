import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { GPUFeature } from '@modules/renderer/engine/hearth/constants.js';

export class HearthTimestamp extends HearthComponent {
  buffers = new WeakMap<object, TimestampBuffers>();
  sets = new WeakMap<object, GPUQuerySet>();

  use(key: object, descriptor: GPURenderPassDescriptor | GPUComputePassDescriptor): void {
    if (this.#enabled) return;

    if (this.sets.has(key)) return;

    const querySet = this.#createQuerySet();

    descriptor.timestampWrites = { querySet, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 };

    this.sets.set(key, querySet);
  }

  prepare(key: object, encoder: GPUCommandEncoder) {
    if (this.#enabled) return;

    const set = this.sets.get(key);
    if (!set) return;

    const size = 2 * BigInt64Array.BYTES_PER_ELEMENT;
    let buffers = this.buffers.get(key);
    if (!buffers) buffers = this.#createBuffers();

    const { query, times } = buffers;

    encoder.resolveQuerySet(set, 0, 2, query, 0);
    encoder.copyBufferToBuffer(query, 0, times, 0, size);
  }

  async resolve(key: object, type: 'render' | 'compute') {
    if (this.#enabled) return;

    const buffers = this.buffers.get(key);
    if (!buffers) return;

    const { times } = buffers;
    await times.mapAsync(GPUMapMode.READ);
    const [start, end] = new BigUint64Array(times.getMappedRange());
    const duration = Number(end - start) / 1000000;

    this.hearth.info.stamp(type, duration);
    times.unmap();
  }

  #createQuerySet(): GPUQuerySet {
    return this.hearth.device.createQuerySet({ type: 'timestamp', count: 2 });
  }

  #createBuffers(): TimestampBuffers {
    return {
      query: this.hearth.device.createBuffer({
        label: 'timestamp resolve buffer',
        size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      }),
      times: this.hearth.device.createBuffer({
        label: 'timestamp result buffer',
        size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      }),
    };
  }

  get #enabled() {
    return this.hearth.hasFeature(GPUFeature.TimestampQuery) && this.hearth.parameters.useTimestamp;
  }
}

interface TimestampBuffers {
  query: GPUBuffer;
  times: GPUBuffer;
}
