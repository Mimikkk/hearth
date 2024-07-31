import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class HearthOcclusion extends HearthComponent {
  resolves = new Map<number, ResolveBuffer>();
  sizes = new WeakMap<object, number>();
  counts = new WeakMap<object, number>();

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

  active = new WeakMap<object, Entity | null>();

  meter(context: RenderContext, into: GPURenderPassDescriptor): void {
    const count = this.sizes.get(context) ?? 0;
    if (count <= 0) return;

    const first = this.first.get(context);
    if (first?.set) first.set.destroy();
    if (first?.buffer) first.buffer.destroy();

    const second = this.second.get(context);
    if (second) this.first.set(context, { set: second.set, buffer: second.buffer, objects: second.objects });

    const set = this.hearth.device.createQuerySet({ type: 'occlusion', count: count });

    this.second.set(context, { set, buffer: undefined, objects: new Array(count) });
    this.counts.set(context, 0);
    this.active.delete(context);

    into.occlusionQuerySet = set;
  }

  test(context: RenderContext, entity: Entity, encoder: GPURenderPassEncoder): void {
    const seco = this.second.get(context);
    if (seco?.set === undefined) return;

    const active = this.active.get(context);
    if (active === entity) return;

    if (active?.useOcclusion) {
      encoder.endOcclusionQuery();

      this.counts.set(context, this.counts.get(context)! + 1);
    }

    if (entity.useOcclusion) {
      const index = this.counts.get(context)!;

      encoder.beginOcclusionQuery(index);

      seco.objects![index] = entity;
    }
    this.active.set(context, entity);
  }

  end(context: RenderContext): void {
    const data = this.hearth.memo.get(context);

    const count = this.sizes.get(context) ?? 0;
    const index = this.counts.get(context)!;
    if (count > index) data.currentPass.endOcclusionQuery();
  }

  encode(context: RenderContext, encoder: GPUCommandEncoder): void {
    const count = this.sizes.get(context) ?? 0;

    if (count <= 0) return;

    const size = count * 8;
    let resolve = this.resolves.get(size);
    if (resolve === undefined) {
      resolve = ResolveBuffer.fromDevice(this.hearth.device, size);
      this.resolves.set(size, resolve);
    }

    const sizes = this.hearth.device.createBuffer({
      size: size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const second = this.second.get(context);

    second!.buffer = sizes;
    encoder.resolveQuerySet(second!.set!, 0, count, resolve.buffer, 0);
    encoder.copyBufferToBuffer(resolve.buffer, 0, sizes, 0, size);
  }

  occluded: WeakMap<object, WeakSet<Entity>> = new WeakMap();

  async resolve(context: RenderContext): Promise<void> {
    const first = this.first.get(context);
    if (!first) return;

    const { buffer, objects } = first;
    if (!buffer || !objects) return;

    first.objects = undefined;
    first.buffer = undefined;

    await buffer.mapAsync(GPUMapMode.READ);
    const range = buffer.getMappedRange();

    const occluded = new WeakSet();
    const results = new BigUint64Array(range);
    for (let i = 0; i < objects.length; ++i) if (results[i] !== BigInt(0)) occluded.add(objects[i]);
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
