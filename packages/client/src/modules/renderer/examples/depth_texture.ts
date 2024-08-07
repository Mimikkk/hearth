import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshBasicNodeMaterial, texture } from '@modules/renderer/engine/nodes/nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { TextureDataType } from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, controls, hearth;

let quad, renderTarget;

const dpr = window.devicePixelRatio;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 20);
  camera.position.z = 4;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222222);
  scene.overrideMaterial = new MeshBasicNodeMaterial();

  const geometry = new Engine.TorusKnotGeometry(1, 0.3, 128, 64);

  const count = 50;
  const scale = 5;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * 2.0 * Math.PI;
    const z = Math.random() * 2.0 - 1.0;
    const zScale = Math.sqrt(1.0 - z * z) * scale;

    const mesh = new Engine.Mesh(geometry);
    mesh.position.set(Math.cos(r) * zScale, Math.sin(r) * zScale, z * scale);
    mesh.setRotation(Math.random(), Math.random(), Math.random());
    scene.add(mesh);
  }

  hearth = await Hearth.as();
  hearth.setPixelRatio(dpr);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  const depthTexture = new Engine.DepthTexture();
  depthTexture.type = Engine.TextureDataType.Float;

  renderTarget = new Engine.RenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);
  renderTarget.depthTexture = depthTexture;

  useWindowResizer(hearth, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    hearth.setSize(window.innerWidth, window.innerHeight);
    renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  });

  const materialFX = new MeshBasicNodeMaterial();
  materialFX.colorNode = texture(depthTexture);

  quad = new QuadMesh(materialFX);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.enableDamping = true;
}

function animate() {
  hearth.updateRenderTarget(renderTarget);
  hearth.render(scene, camera);

  hearth.updateRenderTarget(null);
  quad.render(hearth);
}
