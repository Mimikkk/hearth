import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { WeakMemo } from '@modules/renderer/engine/hearth/memo/WeakMemo.js';

export class HearthOcclusion extends HearthComponent {
  resolves = new Map<number, ResolveBuffer>();

  meter(context: RenderContext, into: GPURenderPassDescriptor) {
    const count = context.occlusionQueryCount;
    if (count <= 0) return;

    const data = this.hearth.memo.get(context);

    let set;
    if (data.currentOcclusionQuerySet) data.currentOcclusionQuerySet.destroy();
    if (data.currentOcclusionQueryBuffer) data.currentOcclusionQueryBuffer.destroy();

    data.currentOcclusionQuerySet = data.occlusionQuerySet;
    data.currentOcclusionQueryBuffer = data.occlusionQueryBuffer;
    data.currentOcclusionQueryObjects = data.occlusionQueryObjects;
    set = this.hearth.device.createQuerySet({ type: 'occlusion', count: count });

    data.occlusionQuerySet = set;
    data.occlusionQueryIndex = 0;
    data.occlusionQueryObjects = new Array(count);
    data.lastOcclusionObject = null;

    into.occlusionQuerySet = set;
  }

  end(context: RenderContext) {
    const count = context.occlusionQueryCount;
    const data = this.hearth.memo.get(context);

    if (count > data.occlusionQueryIndex) data.currentPass.endOcclusionQuery();
  }

  encode(context: RenderContext, encoder: GPUCommandEncoder) {
    const count = context.occlusionQueryCount;
    if (count <= 0) return;
    const data = this.hearth.memo.get(context);

    const bufferSize = count * 8;

    let resolve = this.resolves.get(bufferSize);

    if (resolve === undefined) {
      resolve = ResolveBuffer.fromDevice(this.hearth.device, bufferSize);

      this.resolves.set(bufferSize, resolve);
    }

    const read = this.hearth.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    encoder.resolveQuerySet(data.occlusionQuerySet, 0, count, resolve.buffer, 0);
    encoder.copyBufferToBuffer(resolve.buffer, 0, read, 0, bufferSize);

    data.occlusionQueryBuffer = read;
  }

  async resolve(context: RenderContext) {
    const data = this.hearth.memo.get(context);

    const { currentOcclusionQueryBuffer, currentOcclusionQueryObjects } = data;
    if (!currentOcclusionQueryBuffer || !currentOcclusionQueryObjects) return;

    const occluded = new WeakSet();
    data.currentOcclusionQueryObjects = null;
    data.currentOcclusionQueryBuffer = null;

    await currentOcclusionQueryBuffer.mapAsync(GPUMapMode.READ);
    const buffer = currentOcclusionQueryBuffer.getMappedRange();

    const results = new BigUint64Array(buffer);
    for (let i = 0; i < currentOcclusionQueryObjects.length; i++) {
      if (results[i] !== BigInt(0)) occluded.add(currentOcclusionQueryObjects[i]);
    }
    currentOcclusionQueryBuffer.destroy();

    data.occluded = occluded;
  }
}

class ResolveBuffer {
  constructor(public buffer: GPUBuffer) {}

  static fromDevice(device: GPUDevice, size: number) {
    return new ResolveBuffer(
      device.createBuffer({
        size,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      }),
    );
  }
}

class OcclusionBuffers {
  constructor(
    public resolve: GPUBuffer,
    public times: GPUBuffer,
    public pending: boolean = false,
  ) {}

  static fromDevice(device: GPUDevice) {
    return new OcclusionBuffers(
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

class OcclusionQuery {
  constructor(public set: GPUQuerySet) {}

  static fromDevice(device: GPUDevice) {
    return new OcclusionQuery(device.createQuerySet({ type: 'timestamp', count: 2 }));
  }

  encodeTransfer(encoder: GPUCommandEncoder, into: GPUBuffer): void {
    encoder.resolveQuerySet(this.set, 0, 2, into, 0);
  }
}
