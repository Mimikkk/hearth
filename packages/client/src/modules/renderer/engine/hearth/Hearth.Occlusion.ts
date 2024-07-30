import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { WeakMemo } from '@modules/renderer/engine/hearth/memo/WeakMemo.js';

export class HearthOcclusion extends HearthComponent {
  map: WeakMap<object, {}>;

  meter(context: RenderContext, into: GPURenderPassDescriptor) {
    const occlusionQueryCount = context.occlusionQueryCount;
    if (occlusionQueryCount <= 0) return;

    const data = this.hearth.memo.get(context);

    let set;
    if (data.currentOcclusionQuerySet) data.currentOcclusionQuerySet.destroy();
    if (data.currentOcclusionQueryBuffer) data.currentOcclusionQueryBuffer.destroy();

    data.currentOcclusionQuerySet = data.occlusionQuerySet;
    data.currentOcclusionQueryBuffer = data.occlusionQueryBuffer;
    data.currentOcclusionQueryObjects = data.occlusionQueryObjects;
    set = this.hearth.device.createQuerySet({ type: 'occlusion', count: occlusionQueryCount });

    data.occlusionQuerySet = set;
    data.occlusionQueryIndex = 0;
    data.occlusionQueryObjects = new Array(occlusionQueryCount);
    data.lastOcclusionObject = null;

    into.occlusionQuerySet = set;
  }

  end(context: RenderContext) {
    const occlusionQueryCount = context.occlusionQueryCount;
    const data = this.hearth.memo.get(context);

    if (occlusionQueryCount > data.occlusionQueryIndex) data.currentPass.endOcclusionQuery();
  }

  encode(context: RenderContext, encoder: GPUCommandEncoder) {
    const occlusionQueryCount = context.occlusionQueryCount;
    if (occlusionQueryCount <= 0) return;
    const data = this.hearth.memo.get(context);

    const bufferSize = occlusionQueryCount * 8;

    let queryResolveBuffer = this.hearth.resolveBufferMap.get(bufferSize);

    if (queryResolveBuffer === undefined) {
      queryResolveBuffer = this.hearth.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });

      this.hearth.resolveBufferMap.set(bufferSize, queryResolveBuffer);
    }

    const readBuffer = this.hearth.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    encoder.resolveQuerySet(data.occlusionQuerySet, 0, occlusionQueryCount, queryResolveBuffer, 0);
    encoder.copyBufferToBuffer(queryResolveBuffer, 0, readBuffer, 0, bufferSize);

    data.occlusionQueryBuffer = readBuffer;
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

    // return occluded;
    data.occluded = occluded;
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

class OcclusionQuery {
  constructor(public set: GPUQuerySet) {}

  static fromDevice(device: GPUDevice) {
    return new OcclusionQuery(device.createQuerySet({ type: 'timestamp', count: 2 }));
  }

  encodeTransfer(encoder: GPUCommandEncoder, into: GPUBuffer): void {
    encoder.resolveQuerySet(this.set, 0, 2, into, 0);
  }
}
