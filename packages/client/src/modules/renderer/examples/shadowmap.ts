import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { MeshPhongNodeMaterial, tslFn, vec4, vertexIndex } from '@modules/renderer/engine/nodes/Nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, clock;
let dirLight, spotLight;
let torusKnot, dirGroup;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 10, 20);

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222244);
  scene.fog = new Engine.Fog(0x222244, 50, 100);

  // lights

  scene.add(new Engine.AmbientLight(0x444444, 2));

  spotLight = new Engine.SpotLight(0xff8888, 400);
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.3;
  spotLight.position.set(8, 10, 5);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 8;
  spotLight.shadow.camera.far = 200;
  spotLight.shadow.mapSize.x = 2048;
  spotLight.shadow.mapSize.y = 2048;
  spotLight.shadow.bias = -0.002;
  spotLight.shadow.radius = 4;
  scene.add(spotLight);

  dirLight = new Engine.DirectionalLight(0x8888ff, 3);
  dirLight.position.set(3, 12, 17);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 500;
  dirLight.shadow.camera.right = 17;
  dirLight.shadow.camera.left = -17;
  dirLight.shadow.camera.top = 17;
  dirLight.shadow.camera.bottom = -17;
  dirLight.shadow.mapSize.x = 2048;
  dirLight.shadow.mapSize.y = 2048;
  dirLight.shadow.radius = 4;
  dirLight.shadow.bias = -0.0005;

  dirGroup = new Engine.Group();
  dirGroup.add(dirLight);
  scene.add(dirGroup);

  // geometry

  const geometry = new Engine.TorusKnotGeometry(25, 8, 75, 80);
  const material = new MeshPhongNodeMaterial({
    color: 0x999999,
    shininess: 0,
    specular: 0x222222,
  });

  const materialCustomShadow = material.clone();
  materialCustomShadow.transparent = true;

  const materialColor = vec4(1, 0, 1, 0.5);

  const discardNode = vertexIndex.hash().greaterThan(0.5);

  materialCustomShadow.colorNode = tslFn(() => {
    discardNode.discard();

    return materialColor;
  })();

  materialCustomShadow.shadowNode = tslFn(() => {
    discardNode.discard();

    return materialColor;
  })();

  torusKnot = new Engine.Mesh(geometry, materialCustomShadow);
  torusKnot.scale.multiplyScalar(1 / 18);
  torusKnot.position.y = 3;
  torusKnot.castShadow = true;
  torusKnot.receiveShadow = true;
  scene.add(torusKnot);

  const cylinderGeometry = new Engine.CylinderGeometry(0.75, 0.75, 7, 32);

  const pillar1 = new Engine.Mesh(cylinderGeometry, material);
  pillar1.position.set(8, 3.5, 8);
  pillar1.castShadow = true;
  pillar1.receiveShadow = true;

  const pillar2 = pillar1.clone();
  pillar2.position.set(8, 3.5, -8);
  const pillar3 = pillar1.clone();
  pillar3.position.set(-8, 3.5, 8);
  const pillar4 = pillar1.clone();
  pillar4.position.set(-8, 3.5, -8);

  scene.add(pillar1);
  scene.add(pillar2);
  scene.add(pillar3);
  scene.add(pillar4);

  const planeGeometry = new Engine.PlaneGeometry(200, 200);
  const planeMaterial = new Engine.MeshPhongMaterial({
    color: 0x999999,
    shininess: 0,
    specular: 0x111111,
  });

  const ground = new Engine.Mesh(planeGeometry, planeMaterial);
  ground.setRotationX(-Math.PI / 2);
  ground.scale.scale(3);
  ground.castShadow = true;
  ground.receiveShadow = true;
  scene.add(ground);

  // renderer

  renderer = await Renderer.create();
  renderer.setAnimationLoop(animate);
  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  document.body.appendChild(renderer.parameters.canvas);

  // Mouse control
  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.target.set(0, 2, 0);
  controls.minDistance = 7;
  controls.maxDistance = 40;
  controls.update();

  clock = new Engine.Clock();

  useWindowResizer(renderer, camera);
}

function animate(time) {
  const delta = clock.getDelta();

  torusKnot.rotateX(0.25 * delta);
  torusKnot.rotateY(0.03 * delta);
  torusKnot.rotateZ(1.0 * delta);

  dirGroup.rotateY(0.7 * delta);
  dirLight.position.z = 17 + Math.sin(time * 0.001) * 5;

  renderer.render(scene, camera);
}
