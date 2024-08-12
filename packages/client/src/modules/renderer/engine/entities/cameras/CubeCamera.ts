import { Entity } from '../../core/Entity.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { CubeRenderTarget } from '@modules/renderer/engine/hearth/core/CubeRenderTarget.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';

const fov = -90;
const aspect = 1;

export class CubeCamera extends Entity {
  renderTarget: CubeRenderTarget;
  activeMipmapLevel: number;

  constructor(near: number, far: number, renderTarget: CubeRenderTarget) {
    super();

    this.renderTarget = renderTarget;
    this.activeMipmapLevel = 0;

    const cameraPX = new PerspectiveCamera(fov, aspect, near, far);
    cameraPX.layers = this.layers;

    const cameraNX = new PerspectiveCamera(fov, aspect, near, far);
    cameraNX.layers = this.layers;

    const cameraPY = new PerspectiveCamera(fov, aspect, near, far);
    cameraPY.layers = this.layers;

    const cameraNY = new PerspectiveCamera(fov, aspect, near, far);
    cameraNY.layers = this.layers;

    const cameraPZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraPZ.layers = this.layers;

    const cameraNZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraNZ.layers = this.layers;

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
