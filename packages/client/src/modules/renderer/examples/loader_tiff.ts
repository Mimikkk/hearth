import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { PlaneGeometry } from '@modules/renderer/engine/entities/geometries/PlaneGeometry.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/entities/materials/MeshBasicMaterial.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { ColorSpace } from '../engine/constants.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { TiffLoader } from '@modules/renderer/engine/loaders/textures/TIFFLoader/TIFFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';

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

  const hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(hearth.parameters.canvas);
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

  useWindowResizer(hearth, camera, () => {
    useWindowResizer.updateSize(hearth, camera);
    hearth.render(scene, camera);
  });

  await hearth.render(scene, camera);
}

init();
