import * as Engine from '@modules/renderer/engine/engine.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.ts';
import { MeshStandardNodeMaterial, parallaxUV, texture, uv } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { CubeTextureLoader } from '@modules/renderer/engine/loaders/textures/CubeTextureLoader/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

let controls;

init();

async function init() {
  // scene

  scene = new Engine.Scene();

  // camera

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(10, 14, 10);

  // environment

  const environmentTexture = new CubeTextureLoader().loadAsync([
    'resources/textures/cube/Park2/posx.jpg',
    'resources/textures/cube/Park2/negx.jpg',
    'resources/textures/cube/Park2/posy.jpg',
    'resources/textures/cube/Park2/negy.jpg',
    'resources/textures/cube/Park2/posz.jpg',
    'resources/textures/cube/Park2/negz.jpg',
  ]);

  scene.environment = environmentTexture;
  scene.background = environmentTexture;

  // textures

  const loader = new TextureLoader();

  const topTexture = await loader.loadAsync('resources/textures/ambientcg/Ice002_1K-JPG_Color.jpg');
  topTexture.colorSpace = Engine.ColorSpace.SRGB;

  const roughnessTexture = await loader.loadAsync('resources/textures/ambientcg/Ice002_1K-JPG_Roughness.jpg');
  roughnessTexture.colorSpace = Engine.ColorSpace.No;

  const normalTexture = await loader.loadAsync('resources/textures/ambientcg/Ice002_1K-JPG_NormalGL.jpg');
  normalTexture.colorSpace = Engine.ColorSpace.No;

  const displaceTexture = await loader.loadAsync('resources/textures/ambientcg/Ice002_1K-JPG_Displacement.jpg');
  displaceTexture.colorSpace = Engine.ColorSpace.No;

  //

  const bottomTexture = await loader.loadAsync('resources/textures/ambientcg/Ice003_1K-JPG_Color.jpg');
  bottomTexture.colorSpace = Engine.ColorSpace.SRGB;
  bottomTexture.wrapS = Engine.Wrapping.Repeat;
  bottomTexture.wrapT = Engine.Wrapping.Repeat;

  // paralax effect

  const parallaxScale = 0.3;
  const offsetUV = texture(displaceTexture).mul(parallaxScale);

  const parallaxUVOffset = parallaxUV(uv(), offsetUV);
  const parallaxResult = texture(bottomTexture, parallaxUVOffset);

  const iceNode = texture(topTexture).overlay(parallaxResult);

  // material

  const material = new MeshStandardNodeMaterial();
  material.colorNode = iceNode.mul(5); // increase the color intensity to 5 ( contrast )
  material.roughnessNode = texture(roughnessTexture);
  material.normalMap = normalTexture;
  material.metalness = 0;

  const geometry = new Engine.BoxGeometry(10, 10, 10);

  const ground = new Engine.Mesh(geometry, material);
  ground.rotateX(-Math.PI / 2);
  scene.add(ground);

  // renderer

  renderer = new Renderer({
    toneMapping: Engine.ToneMapping.Reinhard,
    toneMappingExposure: 6,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.canvas);

  // controls

  controls = new OrbitControls(camera, renderer.canvas);
  controls.target.set(0, 0, 0);
  controls.maxDistance = 40;
  controls.minDistance = 10;
  controls.autoRotate = true;
  controls.autoRotateSpeed = -1;
  controls.update();

  useWindowResizer(renderer, camera);
}

function animate() {
  controls.update();

  renderer.render(scene, camera);
}
