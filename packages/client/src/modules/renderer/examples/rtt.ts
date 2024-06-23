import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshBasicNodeMaterial, texture, uniform } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { QuadMesh } from '@modules/renderer/engine/objects/QuadMesh.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
const mouse = new Engine.Vector2();

let quadMesh, renderTarget;

let box;

const dpr = window.devicePixelRatio;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.z = 3;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x0066ff);

  // textured mesh

  const loader = new TextureLoader();
  const uvTexture = await loader.loadAsync('resources/textures/uv_grid_opengl.jpg');

  const geometryBox = new Engine.BoxGeometry();
  const materialBox = new MeshBasicNodeMaterial();
  materialBox.colorNode = texture(uvTexture);

  //

  box = new Engine.Mesh(geometryBox, materialBox);
  scene.add(box);

  //

  renderer = new Renderer();
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.canvas);

  renderTarget = new Engine.RenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);

  window.addEventListener('mousemove', onWindowMouseMove);
  useWindowResizer(renderer, camera);
  window.addEventListener('resize', () => {
    useWindowResizer.updateSize(renderer, camera);
    renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  });

  // FX

  // modulate the final color based on the mouse position

  const screenFXNode = uniform(mouse);

  const materialFX = new MeshBasicNodeMaterial();
  materialFX.colorNode = texture(renderTarget.texture).rgb.saturation(screenFXNode.x.oneMinus()).hue(screenFXNode.y);

  quadMesh = new QuadMesh(materialFX);
}

function onWindowMouseMove(e) {
  mouse.x = e.offsetX / window.innerWidth;
  mouse.y = e.offsetY / window.innerHeight;
}

function animate() {
  box.rotation.x += 0.01;
  box.rotation.y += 0.02;

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  quadMesh.render(renderer);
}
