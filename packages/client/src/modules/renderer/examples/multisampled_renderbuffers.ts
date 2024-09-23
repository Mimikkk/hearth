import * as Engine from '@mimi/hearth';
import { texture, MeshBasicNodeMaterial, MeshPhongNodeMaterial } from '@mimi/hearth';

import { GUI } from 'lil-gui';

import { Hearth } from '@mimi/hearth';

import { QuadMesh } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
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
const fullRadius = 20;
const halfRadius = 10;
const positions = new Array(count).fill().map((_, i) => {
  const radius = i % 2 === 0 ? fullRadius : halfRadius;

  const phi = Math.acos(2 * Math.random() - 1) - Math.PI / 2;
  const theta = 2 * Math.PI * Math.random();

  return new Engine.Vec3(
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.sin(theta),
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

  const geometryBox = new Engine.BoxGeometry(7, 7, 7, 12, 12, 12);
  const materialBox = new MeshPhongNodeMaterial();
  const materialBoxInner = new MeshPhongNodeMaterial({ color: 0xff0000 });

  materialBox.wireframe = true;

  box = new Engine.InstancedMesh(geometryBox, materialBox, count);
  box2 = new Engine.InstancedMesh(geometryBox, materialBoxInner, count);

  for (let i = 0; i < count; i++) {
    box.setMatrixAt(i, mat4.asIdentity().setPosition(positions[i]));
    box2.setMatrixAt(i, mat4.mulVec(0.996).setPosition(positions[i]));
  }

  scene.add(box, box2);

  hearth = await Hearth.as();
  hearth.setPixelRatio(dpr);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  renderTarget = new Engine.RenderTarget(window.innerWidth * dpr, window.innerHeight * dpr, {
    samples: params.samples,
    depthBuffer: true,
  });

  window.addEventListener('mousemove', onWindowMouseMove);
  useWindowResizer(hearth, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    hearth.setSize(window.innerWidth, window.innerHeight);
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

  hearth.updateRenderTarget(renderTarget);
  hearth.render(scene, camera);

  hearth.updateRenderTarget(null);
  quadMesh.render(hearth);
}
