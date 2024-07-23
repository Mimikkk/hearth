import * as Engine from '@modules/renderer/engine/engine.js';
import { texture, MeshBasicNodeMaterial, MeshPhongNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';

import { GUI } from 'lil-gui';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { QuadMesh } from '@modules/renderer/engine/objects/QuadMesh.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
const mouse = new Engine.Vec2();

let quadMesh, renderTarget;

let box, box2;

const dpr = 1;

const params = {
  animated: true,
  samples: 4,
};

const mat4 = new Engine.Mat4();

const count = 50;
const fullRadius = 20; // Radius of the sphere
const halfRadius = 10; // Radius of the sphere
const positions = new Array(count).fill().map((_, i) => {
  const radius = i % 2 === 0 ? fullRadius : halfRadius;

  const phi = Math.acos(2 * Math.random() - 1) - Math.PI / 2; // phi: latitude, range -π/2 to π/2
  const theta = 2 * Math.PI * Math.random(); // theta: longitude, range 0 to 2π

  return new Engine.Vec3(
    radius * Math.cos(phi) * Math.cos(theta), // x
    radius * Math.sin(phi), // y
    radius * Math.cos(phi) * Math.sin(theta), // z
  );
});

initGUI();
init();

function initGUI() {
  const gui = new GUI();
  gui.add(params, 'samples', 0, 4).step(1);
  gui.add(params, 'animated', true);
}

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.z = 3;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x111111);

  // textured mesh

  const geometryBox = new Engine.BoxGeometry(7, 7, 7, 12, 12, 12);
  const materialBox = new MeshPhongNodeMaterial();
  const materialBoxInner = new MeshPhongNodeMaterial({ color: 0xff0000 });

  materialBox.wireframe = true;

  //

  box = new Engine.InstancedMesh(geometryBox, materialBox, count);
  box2 = new Engine.InstancedMesh(geometryBox, materialBoxInner, count);

  for (let i = 0; i < count; i++) {
    box.setMatrixAt(i, mat4.asIdentity().setPosition(positions[i]));
    box2.setMatrixAt(i, mat4.mulVec(0.996).setPosition(positions[i]));
  }

  scene.add(box, box2);

  //

  renderer = await Renderer.create();
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  renderTarget = new Engine.RenderTarget(window.innerWidth * dpr, window.innerHeight * dpr, {
    samples: params.samples,
    depthBuffer: true,
  });

  window.addEventListener('mousemove', onWindowMouseMove);
  useWindowResizer(renderer, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  });

  const materialFX = new MeshBasicNodeMaterial();
  materialFX.colorNode = texture(renderTarget.texture).rgb;

  quadMesh = new QuadMesh(materialFX);
}

function onWindowMouseMove(e) {
  mouse.x = e.offsetX / window.innerWidth;
  mouse.y = e.offsetY / window.innerHeight;
}

function animate() {
  if (params.animated) {
    box.rotateX(0.001);
    box.rotateY(0.002);
    box2.rotateX(0.001);
    box2.rotateY(0.002);
  }

  renderTarget.samples = params.samples;

  renderer.updateRenderTarget(renderTarget);
  renderer.render(scene, camera);

  renderer.updateRenderTarget(null);
  quadMesh.render(renderer);
}
