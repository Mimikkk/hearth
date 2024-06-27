import { Vector3 } from '../math/Vector3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Audio } from './Audio.js';

const _position = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ Quaternion.identity();
const _scale = /*@__PURE__*/ new Vector3();
const _orientation = /*@__PURE__*/ new Vector3();

export class PositionalAudio extends Audio<PannerNode> {
  panner: PannerNode;

  constructor(listener: AudioListener) {
    super(listener);

    this.panner = this.context.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.connect(this.gain);
  }

  connect() {
    super.connect();

    this.panner.connect(this.gain);
  }

  disconnect() {
    super.disconnect();

    this.panner.disconnect(this.gain);
  }

  getOutput(): PannerNode {
    return this.panner;
  }

  getRefDistance(): number {
    return this.panner.refDistance;
  }

  setRefDistance(value: number): this {
    this.panner.refDistance = value;

    return this;
  }

  getRolloffFactor(): number {
    return this.panner.rolloffFactor;
  }

  setRolloffFactor(value: number): this {
    this.panner.rolloffFactor = value;

    return this;
  }

  getDistanceModel(): DistanceModelType {
    return this.panner.distanceModel;
  }

  setDistanceModel(value: DistanceModelType): this {
    this.panner.distanceModel = value;

    return this;
  }

  getMaxDistance(): number {
    return this.panner.maxDistance;
  }

  setMaxDistance(value: number): this {
    this.panner.maxDistance = value;

    return this;
  }

  setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): this {
    this.panner.coneInnerAngle = coneInnerAngle;
    this.panner.coneOuterAngle = coneOuterAngle;
    this.panner.coneOuterGain = coneOuterGain;

    return this;
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    if (this.hasPlaybackControl === true && this.isPlaying === false) return this;

    this.matrixWorld.decompose(_position, _quaternion, _scale);

    _orientation.set(0, 0, 1).applyQuaternion(_quaternion);

    const panner = this.panner;
    if (panner.positionX) {
      // code path for Chrome and Firefox (see #14393)
      const endTime = this.context.currentTime + this.listener.timeDelta;

      panner.positionX.linearRampToValueAtTime(_position.x, endTime);
      panner.positionY.linearRampToValueAtTime(_position.y, endTime);
      panner.positionZ.linearRampToValueAtTime(_position.z, endTime);
      panner.orientationX.linearRampToValueAtTime(_orientation.x, endTime);
      panner.orientationY.linearRampToValueAtTime(_orientation.y, endTime);
      panner.orientationZ.linearRampToValueAtTime(_orientation.z, endTime);
    } else {
      panner.setPosition(_position.x, _position.y, _position.z);
      panner.setOrientation(_orientation.x, _orientation.y, _orientation.z);
    }

    return this;
  }
}
