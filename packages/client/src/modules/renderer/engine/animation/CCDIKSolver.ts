import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  Mat4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Skeleton,
  SphereGeometry,
  Vec3,
} from '../engine.js';

const _q = new Quaternion();
const _targetPos = new Vec3();
const _targetVec = new Vec3();
const _effectorPos = new Vec3();
const _effectorVec = new Vec3();
const _linkPos = new Vec3();
const _invLinkQ = new Quaternion();
const _linkScale = new Vec3();
const _axis = new Vec3();
const _vector = new Vec3();
const _matrix = new Mat4();

export interface IKS {
  effector: number;
  iteration?: number | undefined;
  links: Array<{
    enabled?: boolean | undefined;
    index: number;
    limitation?: Vec3 | undefined;
    rotationMin?: Vec3 | undefined;
    rotationMax?: Vec3 | undefined;
  }>;
  minAngle?: number | undefined;
  maxAngle?: number | undefined;
  target: number;
}

/**
 * CCD Algorithm
 *  - https://sites.google.com/site/auraliusproject/ccd-algorithm
 *
 * // ik parameter example
 * //
 * // target, effector, index in links are bone index in skeleton.bones.
 * // the bones relation should be
 * // <-- parent                                  child -->
 * // links[ n ], links[ n - 1 ], ..., links[ 0 ], effector
 * iks = [ {
 *  target: 1,
 *  effector: 2,
 *  links: [ { index: 5, limitation: new Vec3( 1, 0, 0 ) }, { index: 4, enabled: false }, { index : 3 } ],
 *  iteration: 10,
 *  minAngle: 0.0,
 *  maxAngle: 1.0,
 * } ];
 */

export class CCDIKSolver {
  /**
   * @param {engine.SkinnedMesh} mesh
   * @param {Array<Object>} iks
   */
  constructor(mesh, iks = []) {
    this.mesh = mesh;
    this.iks = iks;

    this._valid();
  }

  /**
   * Update all IK bones.
   *
   * @return {CCDIKSolver}
   */
  update() {
    const iks = this.iks;

    for (let i = 0, il = iks.length; i < il; i++) {
      this.updateOne(iks[i]);
    }

    return this;
  }

  /**
   * Update one IK bone
   *
   * @param {Object} ik parameter
   * @return {CCDIKSolver}
   */
  updateOne(ik) {
    const bones = this.mesh.skeleton.bones;

    // for reference overhead reduction in loop
    const math = Math;

    const effector = bones[ik.effector];
    const target = bones[ik.target];

    // don't use getWorldPosition() here for the performance
    // because it calls updateMatrixWorld( true ) inside.
    _targetPos.fromMat4Position(target.matrixWorld);

    const links = ik.links;
    const iteration = ik.iteration !== undefined ? ik.iteration : 1;

    for (let i = 0; i < iteration; i++) {
      let rotated = false;

      for (let j = 0, jl = links.length; j < jl; j++) {
        const link = bones[links[j].index];

        // skip this link and following links.
        // this skip is used for MMD performance optimization.
        if (links[j].enabled === false) break;

        const limitation = links[j].limitation;
        const rotationMin = links[j].rotationMin;
        const rotationMax = links[j].rotationMax;

        // don't use getWorldPosition/Quaternion() here for the performance
        // because they call updateMatrixWorld( true ) inside.
        link.matrixWorld.decompose(_linkPos, _invLinkQ, _linkScale);
        _invLinkQ.invert();
        _effectorPos.fromMat4Position(effector.matrixWorld);

        // work in link world
        _effectorVec.asSub(_effectorPos, _linkPos);
        _effectorVec.applyQuaternion(_invLinkQ);
        _effectorVec.normalize();

        _targetVec.asSub(_targetPos, _linkPos);
        _targetVec.applyQuaternion(_invLinkQ);
        _targetVec.normalize();

        let angle = _targetVec.dot(_effectorVec);

        if (angle > 1.0) {
          angle = 1.0;
        } else if (angle < -1.0) {
          angle = -1.0;
        }

        angle = math.acos(angle);

        // skip if changing angle is too small to prevent vibration of bone
        if (angle < 1e-5) continue;

        if (ik.minAngle !== undefined && angle < ik.minAngle) {
          angle = ik.minAngle;
        }

        if (ik.maxAngle !== undefined && angle > ik.maxAngle) {
          angle = ik.maxAngle;
        }

        _axis.asCross(_effectorVec, _targetVec);
        _axis.normalize();

        _q.fromAxisAngle(_axis, angle);
        link.quaternion.multiply(_q);

        // TODO: re-consider the limitation specification
        if (limitation !== undefined) {
          let c = link.quaternion.w;

          if (c > 1.0) c = 1.0;

          const c2 = math.sqrt(1 - c * c);
          link.quaternion.set(limitation.x * c2, limitation.y * c2, limitation.z * c2, c);
        }

        if (rotationMin !== undefined) {
          const x = link.getRotationX();
          const y = link.getRotationY();
          const z = link.getRotationZ();

          link.setRotation(math.max(rotationMin.x, x), math.max(rotationMin.y, y), math.max(rotationMin.z, z));
        }

        if (rotationMax !== undefined) {
          const x = link.getRotationX();
          const y = link.getRotationY();
          const z = link.getRotationZ();

          link.setRotation(math.min(rotationMax.x, x), math.min(rotationMax.y, y), math.min(rotationMax.z, z));
        }

        link.updateMatrixWorld(true);

        rotated = true;
      }

      if (!rotated) break;
    }

    return this;
  }

  /**
   * Creates Helper
   *
   * @return {CCDIKHelper}
   */
  createHelper() {
    return new CCDIKHelper(this.mesh, this.iks);
  }

  // private methods

  _valid() {
    const iks = this.iks;
    const bones = this.mesh.skeleton.bones;

    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];
      const effector = bones[ik.effector];
      const links = ik.links;
      let link0, link1;

      link0 = effector;

      for (let j = 0, jl = links.length; j < jl; j++) {
        link1 = bones[links[j].index];

        if (link0.parent !== link1) {
          console.warn('engine.CCDIKSolver: bone ' + link0.name + ' is not the child of bone ' + link1.name);
        }

        link0 = link1;
      }
    }
  }
}

function getPosition(bone: Bone, matrixWorldInv: Mat4): Vec3 {
  return _vector.fromMat4Position(bone.matrixWorld).applyMat4(matrixWorldInv);
}

function setPositionOfBoneToAttributeArray(array: ArrayLike<number>, index: number, bone: Bone, matrixWorldInv: Mat4) {
  const v = getPosition(bone, matrixWorldInv);

  array[index * 3 + 0] = v.x;
  array[index * 3 + 1] = v.y;
  array[index * 3 + 2] = v.z;
}

/**
 * Visualize IK bones
 *
 * @param {SkinnedMesh} mesh
 * @param {Array<Object>} iks
 */
export class CCDIKHelper extends Object3D {
  root: Mesh;
  iks: IKS[];
  sphereGeometry: SphereGeometry;
  targetSphereMaterial: MeshBasicMaterial;
  effectorSphereMaterial: MeshBasicMaterial;
  linkSphereMaterial: MeshBasicMaterial;
  lineMaterial: LineBasicMaterial;

  constructor(mesh: Mesh, iks: IKS[], sphereSize: number) {
    super();

    this.root = mesh;
    this.iks = iks;

    this.matrix.from(mesh.matrixWorld);
    this.matrixAutoUpdate = false;

    this.sphereGeometry = new SphereGeometry(sphereSize, 16, 8);

    this.targetSphereMaterial = new MeshBasicMaterial({
      color: new Color(0xff8888),
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.effectorSphereMaterial = new MeshBasicMaterial({
      color: new Color(0x88ff88),
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.linkSphereMaterial = new MeshBasicMaterial({
      color: new Color(0x8888ff),
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.lineMaterial = new LineBasicMaterial({
      color: new Color(0xff0000),
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this._init();
  }

  /**
   * Updates IK bones visualization.
   */
  updateMatrixWorld(force?: boolean): this {
    const mesh = this.root;

    if (this.visible) {
      let offset = 0;

      const iks = this.iks;
      const bones = (mesh as unknown as { skeleton: Skeleton }).skeleton.bones;

      _matrix.from(mesh.matrixWorld).invert();

      for (let i = 0, il = iks.length; i < il; i++) {
        const ik = iks[i];

        const targetBone = bones[ik.target];
        const effectorBone = bones[ik.effector];

        const targetMesh = this.children[offset++];
        const effectorMesh = this.children[offset++];

        targetMesh.position.from(getPosition(targetBone, _matrix));
        effectorMesh.position.from(getPosition(effectorBone, _matrix));

        for (let j = 0, jl = ik.links.length; j < jl; j++) {
          const link = ik.links[j];
          const linkBone = bones[link.index];

          const linkMesh = this.children[offset++];

          linkMesh.position.from(getPosition(linkBone, _matrix));
        }

        const line = this.children[offset++];
        const array = line.geometry!.attributes.position.array;

        setPositionOfBoneToAttributeArray(array, 0, targetBone, _matrix);
        setPositionOfBoneToAttributeArray(array, 1, effectorBone, _matrix);

        for (let j = 0, jl = ik.links.length; j < jl; j++) {
          const link = ik.links[j];
          const linkBone = bones[link.index];
          setPositionOfBoneToAttributeArray(array, j + 2, linkBone, _matrix);
        }

        line.geometry!.attributes.position.needsUpdate = true;
      }
    }

    this.matrix.from(mesh.matrixWorld);

    return super.updateMatrixWorld(force);
  }

  dispose() {
    this.sphereGeometry.dispose();
    this.targetSphereMaterial.dispose();
    this.effectorSphereMaterial.dispose();
    this.linkSphereMaterial.dispose();
    this.lineMaterial.dispose();

    const children = this.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (child instanceof Line) child.geometry.dispose();
    }
  }

  // private method

  _init() {
    const scope = this;
    const iks = this.iks;

    function createLineGeometry(ik: IKS) {
      const geometry = new BufferGeometry();
      const vertices = new Float32Array((2 + ik.links.length) * 3);
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));

      return geometry;
    }

    function createTargetMesh() {
      return new Mesh(scope.sphereGeometry, scope.targetSphereMaterial);
    }

    function createEffectorMesh() {
      return new Mesh(scope.sphereGeometry, scope.effectorSphereMaterial);
    }

    function createLinkMesh() {
      return new Mesh(scope.sphereGeometry, scope.linkSphereMaterial);
    }

    function createLine(ik: IKS) {
      return new Line(createLineGeometry(ik), scope.lineMaterial);
    }

    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];

      this.add(createTargetMesh());
      this.add(createEffectorMesh());

      for (let j = 0, jl = ik.links.length; j < jl; j++) {
        this.add(createLinkMesh());
      }

      this.add(createLine(ik));
    }
  }
}
