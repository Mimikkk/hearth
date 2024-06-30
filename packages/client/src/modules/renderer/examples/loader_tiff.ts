import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { PlaneGeometry } from '@modules/renderer/engine/geometries/PlaneGeometry.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/materials/MeshBasicMaterial.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { ColorSpace } from '../engine/constants.ts';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { TiffLoader } from '@modules/renderer/engine/loaders/textures/TIFFLoader/TIFFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { DataTexture } from '@modules/renderer/engine/textures/DataTexture.js';

const geometry = new PlaneGeometry();
const createMesh = (map: DataTexture, [x, y, z]: [x: number, y: number, z: number]) => {
  map.colorSpace = ColorSpace.SRGB;
  const material = new MeshBasicMaterial({ map });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
};

async function init() {
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.set(0, 0, 4);

  const renderer = await Renderer.create();
  document.body.appendChild(renderer.parameters.canvas);
  const [uncompressed, lzw, jpeg] = await TiffLoader.loadAsyncMultiple([
    'resources/textures/tiff/crate_uncompressed.tif',
    'resources/textures/tiff/crate_lzw.tif',
    'resources/textures/tiff/crate_jpeg.tif',
  ]);

  const mesh1 = createMesh(uncompressed, [-1.125, 0, 0]);
  const mesh2 = createMesh(lzw, [0, 0, 0]);
  const mesh3 = createMesh(jpeg, [1.125, 0, 0]);

  const scene = new Scene();
  scene.add(mesh1, mesh2, mesh3);

  useWindowResizer(renderer, camera, () => {
    useWindowResizer.updateSize(renderer, camera);
    renderer.render(scene, camera);
  });

  await renderer.render(scene, camera);
}

init();
