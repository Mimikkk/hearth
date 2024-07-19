import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { LineSegments } from '@modules/renderer/engine/objects/LineSegments.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { Sprite } from '@modules/renderer/engine/objects/Sprite.js';
import { Points } from '@modules/renderer/engine/objects/Points.js';
import { Line } from '@modules/renderer/engine/objects/Line.js';

export class Info {
  autoReset: boolean;
  frame: number;
  passes: number;
  render: {
    calls: number;
    passes: number;
    triangles: number;
    points: number;
    lines: number;
    timestamp: number;
  };

  compute: {
    passes: number;
    timestamp: number;
  };

  memory: {
    geometries: number;
    textures: number;
  };

  constructor() {
    this.autoReset = true;

    this.frame = 0;
    this.passes = 0;

    this.render = {
      passes: 0,
      calls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      timestamp: 0,
    };

    this.compute = {
      passes: 0,
      timestamp: 0,
    };

    this.memory = {
      geometries: 0,
      textures: 0,
    };
  }

  update(object: Object3D, count: number, instanceCount: number = 1) {
    this.render.calls++;

    if (Mesh.is(object) || Sprite.is(object)) {
      this.render.triangles += instanceCount * (count / 3);
    } else if (Points.is(object)) {
      this.render.points += instanceCount * count;
    } else if (LineSegments.is(object)) {
      this.render.lines += instanceCount * (count / 2);
    } else if (Line.is(object)) {
      this.render.lines += instanceCount * (count - 1);
    } else {
      throw Error('Unknown object type');
    }
  }

  updateTimestamp(type: 'render' | 'compute', time: number) {
    this[type].timestamp += time;
  }

  reset() {
    this.render.calls = 0;
    this.render.triangles = 0;
    this.render.points = 0;
    this.render.lines = 0;
    this.render.timestamp = 0;
    this.compute.timestamp = 0;
  }

  dispose() {
    this.reset();
    this.passes = 0;
    this.render.passes = 0;
    this.compute.passes = 0;
    this.render.timestamp = 0;
    this.compute.timestamp = 0;
    this.memory.geometries = 0;
    this.memory.textures = 0;
  }

  updateRender(): this {
    this.passes++;
    this.render.passes++;
    return this;
  }

  updateCompute(): this {
    this.passes++;
    this.compute.passes++;
    return this;
  }
}
