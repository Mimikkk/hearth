import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshBasicNodeMaterial, texture, uniform } from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
const mouse = new Engine.Vec2();

let quadMesh, renderTarget;

let box;

const dpr = window.devicePixelRatio;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.z = 3;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x0066ff);

  const loader = new TextureLoader();
  const uvTexture = await loader.loadAsync('resources/textures/uv_grid_opengl.jpg');

  const geometryBox = new Engine.BoxGeometry();
  const materialBox = new MeshBasicNodeMaterial();
  materialBox.colorNode = texture(uvTexture);

  box = new Engine.Mesh(geometryBox, materialBox);
  scene.add(box);

  hearth = await Hearth.as();
  hearth.setPixelRatio(dpr);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  renderTarget = new Engine.RenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);

  window.addEventListener('mousemove', onWindowMouseMove);
  useWindowResizer(hearth, camera);
  window.addEventListener('resize', () => {
    useWindowResizer.updateSize(hearth, camera);
    renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  });

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
  box.rotateX(0.01);
  box.rotateY(0.02);

  hearth.updateRenderTarget(renderTarget);
  hearth.render(scene, camera);

  hearth.updateRenderTarget(null);
  quadMesh.render(hearth);
}
