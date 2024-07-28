import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Color } from '../../math/Color.js';
import { Entity } from '../../core/Entity.js';
import { Mesh } from '../Mesh.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/objects/materials/MeshBasicMaterial.js';
import { OctahedronGeometry } from '../geometries/OctahedronGeometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { HemisphereLight } from '@modules/renderer/engine/objects/lights/HemisphereLight.js';

const _vector = Vec3.new();
const _color1 = Color.new();
const _color2 = Color.new();

export class HemisphereLightHelper extends Entity {
  declare type: string | 'HemisphereLightHelper';
  light: HemisphereLight;
  color: Color;
  material: MeshBasicMaterial;

  constructor(light: HemisphereLight, size: number, color: Color) {
    super();

    this.light = light;
    this.matrix = light.matrixWorld;
    this.matrixAutoUpdate = false;
    this.color = color;

    const geometry = new OctahedronGeometry(size);
    geometry.rotateY(Math.PI * 0.5);

    this.material = new MeshBasicMaterial({ wireframe: true, fog: false, toneMapped: false });
    if (this.color === undefined) this.material.vertexColors = true;

    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);

    geometry.setAttribute('color', new Attribute(colors, 3));

    this.add(new Mesh(geometry, this.material));

    this.update();
  }

  update() {
    const mesh = this.children[0];

    if (this.color !== undefined) {
      this.material.color.set(this.color);
    } else {
      const colors = mesh.geometry!.attributes.color;

      _color1.from(this.light.color);
      _color2.from(this.light.groundColor);

      for (let i = 0, l = colors.count; i < l; i++) {
        const color = i < l / 2 ? _color1 : _color2;

        colors.setXYZ(i, color.r, color.g, color.b);
      }

      colors.needsUpdate = true;
    }

    this.light.updateWorldMatrix(true, false);

    mesh.lookAt(_vector.fromMat4Position(this.light.matrixWorld).negate());
  }
}

HemisphereLightHelper.prototype.type = 'HemisphereLightHelper';
