import { LineSegments } from '../LineSegments.js';
import { Mat4 } from '../../math/Mat4.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Color } from '../../math/Color.js';
import { Vec3 } from '../../math/Vec3.js';
import { Geometry } from '../../core/Geometry.js';
import { Attribute } from '../../core/Attribute.js';
import { Entity } from '../../core/Entity.js';
import { Bone } from '../Bone.js';

const _vector = Vec3.new();
const _boneMatrix = new Mat4();
const _matrixWorldInv = new Mat4();

export class SkeletonHelper extends LineSegments {
  declare isSkeletonHelper: true;
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

    geometry.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new Attribute(new Float32Array(colors), 3));

    const material = new LineBasicMaterial({
      vertexColors: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      transparent: true,
    });

    super(geometry, material);

    this.isSkeletonHelper = true;

    this.root = object;
    this.bones = bones;

    this.matrix = object.matrixWorld;
    this.useLocalAutoUpdate = false;
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

    geometry.attributes.position.useUpdate = true;
    return super.updateMatrixWorld(force);
  }
}

SkeletonHelper.prototype.isSkeletonHelper = true;

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
