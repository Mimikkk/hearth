import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class HearthOcclusion extends HearthComponent {
  occluded: WeakMap<WeakKey, WeakSet<Entity>> = new WeakMap();

  buffers = new Map<number, ResolveBuffer>();
  sizes = new WeakMap<WeakKey, number>();
  indices = new WeakMap<WeakKey, number>();
  active = new WeakMap<WeakKey, Entity | null>();
  firstpass = new WeakMap<WeakKey, OcclusionQuery>();
  secondpass = new WeakMap<WeakKey, OcclusionQuery>();

  attach(key: WeakKey, into: GPURenderPassDescriptor): void {
    const count = this.sizes.get(key) ?? 0;
    if (count <= 0) return;

    const first = this.firstpass.get(key);
    if (first?.set) first.set.destroy();
    if (first?.buffer) first.buffer.destroy();

    const second = this.secondpass.get(key);
    if (second) this.firstpass.set(key, OcclusionQuery.from(second));

    const query = OcclusionQuery.fromDevice(this.hearth.device, count);
    this.secondpass.set(key, query);

    this.indices.set(key, 0);
    this.active.delete(key);

    into.occlusionQuerySet = query.set;
  }

  encodeTest(key: WeakKey, against: Entity, encoder: GPURenderPassEncoder): void {
    const second = this.secondpass.get(key);
    if (!second) return;

    const active = this.active.get(key);
    if (active === against) return;

    if (active?.useOcclusion) {
      encoder.endOcclusionQuery();

      this.indices.set(key, this.indices.get(key)! + 1);
    }

    if (against.useOcclusion) {
      const index = this.indices.get(key)!;

      encoder.beginOcclusionQuery(index);

      second.objects[index] = against;
    }

    this.active.set(key, against);
  }

  encodeEnd(key: WeakKey, encoder: GPURenderPassEncoder): void {
    const count = this.sizes.get(key)!;
    const index = this.indices.get(key)!;
    if (count <= index) return;

    encoder.endOcclusionQuery();
  }

  encodeTransfer(key: WeakKey, encoder: GPUCommandEncoder): void {
    const count = this.sizes.get(key) ?? 0;

    if (count <= 0) return;

    const size = count * 8;

    let resolve = this.buffers.get(size);
    if (!resolve) {
      resolve = ResolveBuffer.fromDevice(this.hearth.device, size);
      this.buffers.set(size, resolve);
    }

    const second = this.secondpass.get(key)!;
    second.encodeResolve(encoder, resolve);

    const occlusions = second.initializeOcclusionsBuffer(this.hearth.device, size);
    resolve.encodeTransfer(encoder, occlusions);
  }

  async resolve(key: WeakKey): Promise<void> {
    const first = this.firstpass.get(key);
    if (!first) return;

    this.occluded.set(key, await first.read());
  }
}

class ResolveBuffer {
  constructor(public resolve: GPUBuffer) {}

  static fromDevice(device: GPUDevice, size: number): ResolveBuffer {
    return new ResolveBuffer(
      device.createBuffer({
        label: 'occlusion: resolve buffer',
        size,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      }),
    );
  }

  encodeTransfer(encoder: GPUCommandEncoder, into: GPUBuffer): void {
    encoder.copyBufferToBuffer(this.resolve, 0, into, 0, this.resolve.size);
  }
}

class OcclusionQuery {
  constructor(
    public set: GPUQuerySet,
    public objects: Entity[],
    public buffer?: GPUBuffer,
  ) {}

  static fromDevice(device: GPUDevice, count: number): OcclusionQuery {
    return new OcclusionQuery(
      device.createQuerySet({
        label: 'occlusion: query set',
        type: 'occlusion',
        count,
      }),
      new Array(count),
    );
  }

  static from({ set, objects, buffer }: OcclusionQuery): OcclusionQuery {
    return new OcclusionQuery(set, objects, buffer);
  }

  initializeOcclusionsBuffer(device: GPUDevice, size: number): GPUBuffer {
    const buffer = device.createBuffer({
      label: 'occlusion: occlusions buffer',
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    this.buffer = buffer;

    return buffer;
  }

  async read(): Promise<WeakSet<Entity>> {
    const { buffer, objects } = this;
    if (!buffer || !objects) throw new Error('Occlusions buffer not initialized.');
    this.buffer = undefined;
    this.objects = undefined;

    await buffer.mapAsync(GPUMapMode.READ);
    const range = buffer.getMappedRange();

    const occluded = new WeakSet();
    const results = new BigUint64Array(range);
    for (let i = 0; i < objects.length; ++i) if (results[i] !== BigInt(0)) occluded.add(objects[i]);
    buffer.destroy();

    return occluded;
  }

  encodeResolve(encoder: GPUCommandEncoder, into: ResolveBuffer): void {
    encoder.resolveQuerySet(this.set, 0, this.objects.length, into.resolve, 0);
  }
}
