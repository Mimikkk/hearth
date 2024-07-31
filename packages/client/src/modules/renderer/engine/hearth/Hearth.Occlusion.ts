import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class HearthOcclusion extends HearthComponent {
  resolves = new Map<number, ResolveBuffer>();
  first = new WeakMap<
    object,
    {
      set?: GPUQuerySet;
      buffer?: GPUBuffer;
      objects?: Entity[];
    }
  >();
  second = new WeakMap<
    object,
    {
      set?: GPUQuerySet;
      buffer?: GPUBuffer;
      objects?: Entity[];
    }
  >();

  meter(context: RenderContext, into: GPURenderPassDescriptor): void {
    const count = context.occlusionQueryCount;
    if (count <= 0) return;

    const data = this.hearth.memo.get(context);

    if (data.firstOcclusionQuerySet) data.firstOcclusionQuerySet.destroy();
    if (data.firstOcclusionQueryBuffer) data.firstOcclusionQueryBuffer.destroy();

    data.firstOcclusionQuerySet = data.secondOcclusionQuerySet;
    data.firstOcclusionQueryBuffer = data.secondOcclusionQueryBuffer;
    data.firstOcclusionQueryObjects = data.secondOcclusionQueryObjects;

    const set = this.hearth.device.createQuerySet({ type: 'occlusion', count: count });

    data.secondOcclusionQuerySet = set;
    data.secondOcclusionQueryObjects = new Array(count);

    data.occlusionQueryIndex = 0;
    data.occlusionObject = null;

    into.occlusionQuerySet = set;
  }

  test(context: RenderContext, object: Entity, encoder: GPURenderPassEncoder): void {
    const data = this.hearth.memo.get(context);

    if (data.secondOcclusionQuerySet !== undefined) {
      const second = data.occlusionObject;

      if (second !== object) {
        if (second?.occlusionTest) {
          encoder.endOcclusionQuery();
          data.occlusionQueryIndex++;
        }

        if (object.occlusionTest) {
          encoder.beginOcclusionQuery(data.occlusionQueryIndex);
          data.secondOcclusionQueryObjects[data.occlusionQueryIndex] = object;
        }

        data.occlusionObject = object;
      }
    }
  }

  end(context: RenderContext): void {
    const count = context.occlusionQueryCount;
    const data = this.hearth.memo.get(context);

    if (count > data.occlusionQueryIndex) data.currentPass.endOcclusionQuery();
  }

  encode(context: RenderContext, encoder: GPUCommandEncoder): void {
    const count = context.occlusionQueryCount;
    if (count <= 0) return;
    const data = this.hearth.memo.get(context);

    const size = count * 8;
    let resolve = this.resolves.get(size);
    if (resolve === undefined) {
      resolve = ResolveBuffer.fromDevice(this.hearth.device, size);
      this.resolves.set(size, resolve);
    }

    const read = this.hearth.device.createBuffer({
      size: size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    data.secondOcclusionQueryBuffer = read;

    encoder.resolveQuerySet(data.secondOcclusionQuerySet, 0, count, resolve.buffer, 0);
    encoder.copyBufferToBuffer(resolve.buffer, 0, read, 0, size);
  }

  occluded: WeakMap<object, WeakSet<Entity>> = new WeakMap();

  async resolve(context: RenderContext): Promise<void> {
    const data = this.hearth.memo.get(context);

    const { firstOcclusionQueryBuffer: buffer, firstOcclusionQueryObjects: objects } = data;
    if (!buffer || !objects) return;

    data.firstOcclusionQueryObjects = null;
    data.firstOcclusionQueryBuffer = null;

    await buffer.mapAsync(GPUMapMode.READ);
    const range = buffer.getMappedRange();

    const occluded = new WeakSet();
    const results = new BigUint64Array(range);
    for (let i = 0; i < objects.length; ++i) {
      if (results[i] !== BigInt(0)) occluded.add(objects[i]);
    }
    buffer.destroy();

    this.occluded.set(context, occluded);
  }
}

class ResolveBuffer {
  constructor(public buffer: GPUBuffer) {}

  static fromDevice(device: GPUDevice, size: number) {
    return new ResolveBuffer(
      device.createBuffer({
        label: 'occlusion: resolve buffer',
        size,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      }),
    );
  }
}

class OcclusionQuerySet {
  constructor(
    public set: GPUQuerySet,
    public buffer?: GPUBuffer,
  ) {}

  static fromDevice(device: GPUDevice, count: number) {
    return new OcclusionQuerySet(
      device.createQuerySet({
        label: 'occlusion: query buffer',
        type: 'occlusion',
        count,
      }),
    );
  }

  destroy() {}
}
