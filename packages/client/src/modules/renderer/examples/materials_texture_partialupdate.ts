import * as Engine from '@modules/renderer/engine/engine.js';
import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, clock, dataTexture, diffuseMap;

let last = 0;
const position = new Engine.Vector2();
const color = new Engine.Color();

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 2;

  scene = new Engine.Scene();

  clock = new Engine.Clock();

  const loader = new TextureLoader();
  diffuseMap = await loader.loadAsync('textures/carbon/Carbon.png');
  diffuseMap.colorSpace = Engine.ColorSpace.SRGB;
  diffuseMap.minFilter = Engine.MinificationTextureFilter.Linear;
  diffuseMap.generateMipmaps = false;

  const geometry = new Engine.PlaneGeometry(2, 2);
  const material = new Engine.MeshBasicMaterial({ map: diffuseMap });

  const mesh = new Engine.Mesh(geometry, material);
  scene.add(mesh);

  //

  const width = 32;
  const height = 32;

  const data = new Uint8Array(width * height * 4);
  dataTexture = new Engine.DataTexture(data, width, height);

  //

  renderer = new WebGPURenderer({ antialias: true, forceWebGL: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  //
  animate();

  useWindowResizer(renderer, camera);
}

async function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  await renderer.renderAsync(scene, camera);

  if (elapsedTime - last > 0.1) {
    last = elapsedTime;

    position.x = 32 * Engine.MathUtils.randInt(1, 16) - 32;
    position.y = 32 * Engine.MathUtils.randInt(1, 16) - 32;

    // generate new color data
    updateDataTexture(dataTexture);

    // perform copy from src to dest texture to a random position

    renderer.copyTextureToTexture(position, dataTexture, diffuseMap);
  }
}

function updateDataTexture(texture) {
  const size = texture.image.width * texture.image.height;
  const data = texture.image.data;

  // generate a random color and update texture data

  color.setHex(Math.random() * 0xffffff);

  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  for (let i = 0; i < size; i++) {
    const stride = i * 4;

    data[stride] = r;
    data[stride + 1] = g;
    data[stride + 2] = b;
    data[stride + 3] = 1;
  }

  texture.needsUpdate = true;
}
