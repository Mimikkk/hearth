import { Attribute, Geometry, Line, LineBasicMaterial, PositionalAudio } from '../../engine.js';
import { degreeToRadian } from '../../math/MathUtils.js';

export class PositionalAudioHelper extends Line {
  declare type: string | 'PositionalAudioHelper';
  audio: PositionalAudio;
  range: number;
  divisionsInnerAngle: number;
  divisionsOuterAngle: number;

  constructor(
    audio: PositionalAudio,
    range: number = 1,
    divisionsInnerAngle: number = 16,
    divisionsOuterAngle: number = 2,
  ) {
    const geometry = new Geometry();
    const divisions = divisionsInnerAngle + divisionsOuterAngle * 2;
    const positions = new Float32Array((divisions * 3 + 3) * 3);
    geometry.setAttribute('position', new Attribute(positions, 3));

    const materialInnerAngle = new LineBasicMaterial({ color: 0x00ff00 });
    const materialOuterAngle = new LineBasicMaterial({ color: 0xffff00 });

    super(geometry, [materialOuterAngle, materialInnerAngle] as any);

    this.audio = audio;
    this.range = range;
    this.divisionsInnerAngle = divisionsInnerAngle;
    this.divisionsOuterAngle = divisionsOuterAngle;

    this.update();
  }

  update() {
    const audio = this.audio;
    const range = this.range;
    const divisionsInnerAngle = this.divisionsInnerAngle;
    const divisionsOuterAngle = this.divisionsOuterAngle;

    const coneInnerAngle = degreeToRadian(audio.panner.coneInnerAngle);
    const coneOuterAngle = degreeToRadian(audio.panner.coneOuterAngle);

    const halfConeInnerAngle = coneInnerAngle / 2;
    const halfConeOuterAngle = coneOuterAngle / 2;

    let start = 0;
    let count = 0;
    let i;
    let stride;

    const geometry = this.geometry;
    const positionAttribute = geometry.attributes.position;

    geometry.clearGroups();

    function generateSegment(from: number, to: number, divisions: number, materialIndex: number) {
      const step = (to - from) / divisions;

      positionAttribute.setXYZ(start, 0, 0, 0);
      count++;

      for (i = from; i < to; i += step) {
        stride = start + count;

        positionAttribute.setXYZ(stride, Math.sin(i) * range, 0, Math.cos(i) * range);
        positionAttribute.setXYZ(
          stride + 1,
          Math.sin(Math.min(i + step, to)) * range,
          0,
          Math.cos(Math.min(i + step, to)) * range,
        );
        positionAttribute.setXYZ(stride + 2, 0, 0, 0);

        count += 3;
      }

      geometry.addGroup(start, count, materialIndex);

      start += count;
      count = 0;
    }

    generateSegment(-halfConeOuterAngle, -halfConeInnerAngle, divisionsOuterAngle, 0);
    generateSegment(-halfConeInnerAngle, halfConeInnerAngle, divisionsInnerAngle, 1);
    generateSegment(halfConeInnerAngle, halfConeOuterAngle, divisionsOuterAngle, 0);

    positionAttribute.needsUpdate = true;

    if (coneInnerAngle === coneOuterAngle) (this.material as never as LineBasicMaterial[])[0].visible = false;
  }
}

PositionalAudioHelper.prototype.type = 'PositionalAudioHelper';
