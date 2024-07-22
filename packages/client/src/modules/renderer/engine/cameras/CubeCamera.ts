import { Object3D } from '../core/Object3D.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { CubeRenderTarget } from '../core/CubeRenderTarget.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';

const fov = -90; // negative fov is not an error
const aspect = 1;

export class CubeCamera extends Object3D {
  declare type: string | 'CubeCamera';
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

  update(renderer: Renderer, scene: Scene): void {
    if (this.parent === null) this.updateMatrixWorld();

    const { renderTarget, activeMipmapLevel } = this;

    const [cameraPX, cameraNX, cameraPY, cameraNY, cameraPZ, cameraNZ] = this.children as Camera[];

    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();

    const generateMipmaps = renderTarget.texture.generateMipmaps;

    renderTarget.texture.generateMipmaps = false;

    renderer.setRenderTarget(renderTarget, 0, activeMipmapLevel);
    renderer.render(scene, cameraPX);

    renderer.setRenderTarget(renderTarget, 1, activeMipmapLevel);
    renderer.render(scene, cameraNX);

    renderer.setRenderTarget(renderTarget, 2, activeMipmapLevel);
    renderer.render(scene, cameraPY);

    renderer.setRenderTarget(renderTarget, 3, activeMipmapLevel);
    renderer.render(scene, cameraNY);

    renderer.setRenderTarget(renderTarget, 4, activeMipmapLevel);
    renderer.render(scene, cameraPZ);

    renderTarget.texture.generateMipmaps = generateMipmaps;

    renderer.setRenderTarget(renderTarget, 5, activeMipmapLevel);

    renderer.render(scene, cameraNZ);

    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

    renderTarget.texture.needsPMREMUpdate = true;
  }
}

CubeCamera.prototype.type = 'CubeCamera';
