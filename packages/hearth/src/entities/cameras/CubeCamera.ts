import { Entity, EntityParameters } from '../../core/Entity.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { CubeRenderTarget } from '../../hearth/core/CubeRenderTarget.js';
import { Scene } from '../scenes/Scene.js';
import { Hearth } from '../../hearth/Hearth.js';
import { Camera } from './Camera.js';

const fov = -90;
const aspect = 1;

export class CubeCamera extends Entity {
  renderTarget: CubeRenderTarget;
  activeMipmapLevel: number;

  constructor(parameters: CubeCameraParameters) {
    super(parameters);
    const { near, far, target } = parameters;

    this.renderTarget = target;
    this.activeMipmapLevel = 0;

    const params = { fov, aspect, near, far, layers: this.layers };
    const cameraPX = new PerspectiveCamera(params);
    const cameraNX = new PerspectiveCamera(params);
    const cameraPY = new PerspectiveCamera(params);
    const cameraNY = new PerspectiveCamera(params);
    const cameraPZ = new PerspectiveCamera(params);
    const cameraNZ = new PerspectiveCamera(params);

    cameraPX.lookAt(-1, 0, 0);
    cameraNX.up.set(0, -1, 0);
    cameraNX.lookAt(1, 0, 0);
    cameraPY.up.set(0, 0, 1);
    cameraPY.lookAt(0, 1, 0);
    cameraNY.up.set(0, 0, -1);
    cameraNY.lookAt(0, -1, 0);
    cameraPZ.up.set(0, -1, 0);
    cameraPZ.lookAt(0, 0, 1);
    cameraNZ.up.set(0, -1, 0);
    cameraNZ.lookAt(0, 0, -1);

    this.add(cameraPX);
    cameraPX.updateMatrixWorld();
    this.add(cameraNX);
    cameraNX.updateMatrixWorld();
    this.add(cameraPY);
    cameraPY.updateMatrixWorld();
    this.add(cameraNY);
    cameraNY.updateMatrixWorld();
    this.add(cameraPZ);
    cameraPZ.updateMatrixWorld();
    this.add(cameraNZ);
    cameraNZ.updateMatrixWorld();
  }

  update(hearth: Hearth, scene: Scene): void {
    if (this.parent === null) this.updateMatrixWorld();

    const { renderTarget, activeMipmapLevel } = this;

    const [cameraPX, cameraNX, cameraPY, cameraNY, cameraPZ, cameraNZ] = this.children as Camera[];

    const currentRenderTarget = hearth.target;
    const currentActiveCubeFace = hearth.activeCubeFace;
    const currentActiveMipmapLevel = hearth.activeMipmapLevel;

    const useMipmap = renderTarget.texture.useMipmap;

    renderTarget.texture.useMipmap = false;

    hearth.updateRenderTarget(renderTarget, 0, activeMipmapLevel);
    hearth.render(scene, cameraPX);

    hearth.updateRenderTarget(renderTarget, 1, activeMipmapLevel);
    hearth.render(scene, cameraNX);

    hearth.updateRenderTarget(renderTarget, 2, activeMipmapLevel);
    hearth.render(scene, cameraPY);

    hearth.updateRenderTarget(renderTarget, 3, activeMipmapLevel);
    hearth.render(scene, cameraNY);

    hearth.updateRenderTarget(renderTarget, 4, activeMipmapLevel);
    hearth.render(scene, cameraPZ);

    renderTarget.texture.useMipmap = useMipmap;

    hearth.updateRenderTarget(renderTarget, 5, activeMipmapLevel);

    hearth.render(scene, cameraNZ);

    hearth.updateRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

    renderTarget.texture.usePmremUpdate = true;
  }
}

export interface CubeCameraParameters extends EntityParameters {
  near: number;
  far: number;
  target: CubeRenderTarget;
  activeMipmapLevel?: number;
}
