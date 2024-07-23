import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { LineSegments } from '@modules/renderer/engine/objects/LineSegments.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { Sprite } from '@modules/renderer/engine/objects/Sprite.js';
import { Points } from '@modules/renderer/engine/objects/Points.js';
import { Line } from '@modules/renderer/engine/objects/Line.js';

export class Stats {
  autoReset: boolean;
  frame: number;
  calls: number;
  render: {
    calls: number;
    draws: number;
    triangles: number;
    points: number;
    lines: number;
    timestamp: number;
  };

  compute: {
    calls: number;
    computeCalls: number;
    timestamp: number;
  };

  memory: {
    geometries: number;
    textures: number;
  };

  constructor() {
    this.autoReset = true;

    this.frame = 0;
    this.calls = 0;

    this.render = {
      calls: 0,
      draws: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      timestamp: 0,
    };

    this.compute = {
      calls: 0,
      timestamp: 0,
    };

    this.memory = {
      geometries: 0,
      textures: 0,
    };
  }

  update(object: Object3D, count: number, instanceCount: number = 1) {
    this.render.draws++;

    if (object instanceof Mesh || object instanceof Sprite) {
      this.render.triangles += instanceCount * (count / 3);
    } else if (object instanceof Points) {
      this.render.points += instanceCount * count;
    } else if (object instanceof LineSegments) {
      this.render.lines += instanceCount * (count / 2);
    } else if (object instanceof Line) {
      this.render.lines += instanceCount * (count - 1);
    } else {
      console.error('engine.WebGPUInfo: Unknown object type.');
    }
  }

  stamp(type: 'render' | 'compute', time: number) {
    this[type].timestamp += time;
  }

  reset() {
    this.render.draws = 0;
    this.render.triangles = 0;
    this.render.points = 0;
    this.render.lines = 0;

    this.render.timestamp = 0;
    this.compute.timestamp = 0;
  }

  dispose() {
    this.reset();

    this.calls = 0;

    this.render.calls = 0;
    this.compute.calls = 0;

    this.render.timestamp = 0;
    this.compute.timestamp = 0;
    this.memory.geometries = 0;
    this.memory.textures = 0;
  }
}
