import { CoordinateSystem } from '../constants.js';
import { Object3D } from '../core/Object3D.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { CubeRenderTarget } from '../renderers/CubeRenderTarget.js';
import { Scene } from '@modules/renderer/threejs/scenes/Scene.js';
import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';

const fov = -90; // negative fov is not an error
const aspect = 1;

export class CubeCamera extends Object3D {
  declare type: string | 'CubeCamera';
  renderTarget: CubeRenderTarget;
  coordinateSystem: CoordinateSystem | null;
  activeMipmapLevel: number;

  constructor(near: number, far: number, renderTarget: CubeRenderTarget) {
    super();

    this.renderTarget = renderTarget;
    this.coordinateSystem = null;
    this.activeMipmapLevel = 0;

    const cameraPX = new PerspectiveCamera(fov, aspect, near, far);
    cameraPX.layers = this.layers;
    this.add(cameraPX as unknown as Object3D);

    const cameraNX = new PerspectiveCamera(fov, aspect, near, far);
    cameraNX.layers = this.layers;
    this.add(cameraNX as unknown as Object3D);

    const cameraPY = new PerspectiveCamera(fov, aspect, near, far);
    cameraPY.layers = this.layers;
    this.add(cameraPY as unknown as Object3D);

    const cameraNY = new PerspectiveCamera(fov, aspect, near, far);
    cameraNY.layers = this.layers;
    this.add(cameraNY as unknown as Object3D);

    const cameraPZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraPZ.layers = this.layers;
    this.add(cameraPZ as unknown as Object3D);

    const cameraNZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraNZ.layers = this.layers;
    this.add(cameraNZ as unknown as Object3D);
  }

  updateCoordinateSystem() {
    const coordinateSystem = this.coordinateSystem;

    const cameras = this.children.concat();

    const [cameraPX, cameraNX, cameraPY, cameraNY, cameraPZ, cameraNZ] = cameras;

    for (const camera of cameras) this.remove(camera);

    if (coordinateSystem === CoordinateSystem.WebGL) {
      cameraPX.up.set(0, 1, 0);
      cameraPX.lookAt(1, 0, 0);

      cameraNX.up.set(0, 1, 0);
      cameraNX.lookAt(-1, 0, 0);

      cameraPY.up.set(0, 0, -1);
      cameraPY.lookAt(0, 1, 0);

      cameraNY.up.set(0, 0, 1);
      cameraNY.lookAt(0, -1, 0);

      cameraPZ.up.set(0, 1, 0);
      cameraPZ.lookAt(0, 0, 1);

      cameraNZ.up.set(0, 1, 0);
      cameraNZ.lookAt(0, 0, -1);
    } else if (coordinateSystem === CoordinateSystem.WebGPU) {
      cameraPX.up.set(0, -1, 0);
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
    } else {
      throw new Error('THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: ' + coordinateSystem);
    }

    for (const camera of cameras) {
      this.add(camera);

      camera.updateMatrixWorld();
    }
  }

  update(renderer: Renderer, scene: Scene): void {
    if (this.parent === null) this.updateMatrixWorld();

    const { renderTarget, activeMipmapLevel } = this;

    if (this.coordinateSystem !== renderer.coordinateSystem) {
      this.coordinateSystem = renderer.coordinateSystem;

      this.updateCoordinateSystem();
    }

    const [cameraPX, cameraNX, cameraPY, cameraNY, cameraPZ, cameraNZ] = this.children;

    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();

    const currentXrEnabled = renderer.xr.enabled;

    renderer.xr.enabled = false;

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

    // mipmaps are generated during the last call of render()
    // at this point, all sides of the cube render target are defined

    renderTarget.texture.generateMipmaps = generateMipmaps;

    renderer.setRenderTarget(renderTarget, 5, activeMipmapLevel);
    renderer.render(scene, cameraNZ);

    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

    renderer.xr.enabled = currentXrEnabled;

    renderTarget.texture.needsPMREMUpdate = true;
  }
}

CubeCamera.prototype.type = 'CubeCamera';
