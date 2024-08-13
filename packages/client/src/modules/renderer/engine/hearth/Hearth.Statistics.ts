import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { LineSegments } from '@modules/renderer/engine/entities/LineSegments.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { Sprite } from '@modules/renderer/engine/entities/Sprite.js';
import { Points } from '@modules/renderer/engine/entities/Points.js';
import { Line } from '@modules/renderer/engine/entities/Line.js';

export class HearthStatistics {
  useAutoTick: boolean;
  frame: number;
  passes: number;
  render: {
    passes: number;
    previousCalls: number;
    calls: number;
    triangles: number;
    points: number;
    lines: number;
    timestampTime: number;
    timestampCalls: number;
  };
  compute: {
    passes: number;
    previousCalls: number;
    calls: number;
    timestampTime: number;
    timestampCalls: number;
  };
  memory: {
    geometries: number;
    textures: number;
  };

  constructor() {
    this.useAutoTick = true;

    this.frame = 0;
    this.passes = 0;

    this.render = {
      passes: 0,
      previousCalls: 0,
      calls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      timestampTime: 0,
      timestampCalls: 0,
    };

    this.compute = {
      passes: 0,
      previousCalls: 0,
      calls: 0,
      timestampTime: 0,
      timestampCalls: 0,
    };

    this.memory = {
      geometries: 0,
      textures: 0,
    };
  }

  update(object: Entity, count: number, instanceCount: number) {
    this.render.calls++;

    if (object instanceof Mesh || object instanceof Sprite) {
      this.render.triangles += instanceCount * (count / 3);
    } else if (object instanceof Points) {
      this.render.points += instanceCount * count;
    } else if (object instanceof LineSegments) {
      this.render.lines += instanceCount * (count / 2);
    } else if (object instanceof Line) {
      this.render.lines += instanceCount * (count - 1);
    } else {
      console.error('Info: Unknown object type.');
    }
  }

  stamp(type: 'render' | 'compute', time: number) {
    if (this[type].timestampCalls === 0) this[type].timestampTime = 0;

    this[type].timestampTime += time;
    this[type].timestampCalls++;

    if (this[type].timestampCalls < this[type].previousCalls) return;
    this[type].timestampCalls = 0;
  }

  tick() {
    this.render.previousCalls = this.render.calls;
    this.render.calls = 0;
    this.render.triangles = 0;
    this.render.points = 0;
    this.render.lines = 0;

    this.compute.previousCalls = this.compute.calls;
    this.compute.calls = 0;
  }

  dispose() {
    this.tick();

    this.passes = 0;
    this.render.passes = 0;
    this.compute.passes = 0;

    this.render.timestampTime = 0;
    this.compute.timestampTime = 0;

    this.memory.textures = 0;
    this.memory.geometries = 0;
  }
}
