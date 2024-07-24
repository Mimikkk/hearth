import { LineSegments } from '../objects/LineSegments.js';
import { Mat4 } from '../math/Mat4.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { Color } from '../math/Color.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Bone } from '@modules/renderer/engine/objects/Bone.js';

const _vector = Vec3.new();
const _boneMatrix = new Mat4();
const _matrixWorldInv = new Mat4();

export class SkeletonHelper extends LineSegments {
  declare isSkeletonHelper: true;
  declare type: string | 'SkeletonHelper';
  root: Entity;
  bones: Bone[];

  constructor(object: Entity) {
    const bones = getBoneList(object);

    const geometry = new Geometry();

    const vertices = [];
    const colors = [];

    const color1 = Color.new(0, 0, 1);
    const color2 = Color.new(0, 1, 0);

    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];

      if (bone.parent instanceof Bone) {
        vertices.push(0, 0, 0);
        vertices.push(0, 0, 0);
        colors.push(color1.r, color1.g, color1.b);
        colors.push(color2.r, color2.g, color2.b);
      }
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

    const material = new LineBasicMaterial({
      vertexColors: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      transparent: true,
    });

    super(geometry, material);

    this.isSkeletonHelper = true;

    this.type = 'SkeletonHelper';

    this.root = object;
    this.bones = bones;

    this.matrix = object.matrixWorld;
    this.matrixAutoUpdate = false;
  }

  updateMatrixWorld(force?: boolean): this {
    const bones = this.bones;

    const geometry = this.geometry;
    const position = geometry.attributes.position;

    _matrixWorldInv.from(this.root.matrixWorld).invert();

    for (let i = 0, j = 0; i < bones.length; i++) {
      const bone = bones[i];

      if (bone.parent instanceof Bone) {
        _boneMatrix.asMul(_matrixWorldInv, bone.matrixWorld);
        _vector.fromMat4Position(_boneMatrix);
        position.setXYZ(j, _vector.x, _vector.y, _vector.z);

        _boneMatrix.asMul(_matrixWorldInv, bone.parent.matrixWorld);
        _vector.fromMat4Position(_boneMatrix);
        position.setXYZ(j + 1, _vector.x, _vector.y, _vector.z);

        j += 2;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    return super.updateMatrixWorld(force);
  }
}

SkeletonHelper.prototype.isSkeletonHelper = true;
SkeletonHelper.prototype.type = 'SkeletonHelper';

function getBoneList(object: Entity) {
  const boneList = [];

  if (object instanceof Bone) {
    boneList.push(object);
  }

  for (let i = 0; i < object.children.length; i++) {
    boneList.push.apply(boneList, getBoneList(object.children[i]));
  }

  return boneList;
}
