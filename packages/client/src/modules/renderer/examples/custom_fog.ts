import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  f32,
  fog,
  MeshPhongNodeMaterial,
  normalWorld,
  positionView,
  positionWorld,
  timerLocal,
  triNoise3D,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let controls;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 600);
  camera.position.set(30, 15, 30);

  scene = new Engine.Scene();



  const skyColor = color(0xf0f5f5);
  const groundColor = color(0xd0dee7);

  const fogNoiseDistance = positionView.z.negate().smoothstep(0, camera.far - 300);

  const distance = fogNoiseDistance.mul(20).max(4);
  const alpha = 0.98;
  const groundFogArea = f32(distance).sub(positionWorld.y).div(distance).pow(3).saturate().mul(alpha);

  const timer = timerLocal(1);

  const fogNoiseA = triNoise3D(positionWorld.mul(0.005), 0.2, timer);
  const fogNoiseB = triNoise3D(positionWorld.mul(0.01), 0.2, timer.mul(1.2));

  const fogNoise = fogNoiseA.add(fogNoiseB).mul(groundColor);



  scene.fogNode = fog(fogNoiseDistance.oneMinus().mix(groundColor, fogNoise), groundFogArea);
  scene.backgroundNode = normalWorld.y.max(0).mix(groundColor, skyColor);



  const buildWindows = positionWorld.y
    .mul(10)
    .floor()
    .mod(4)
    .sign()
    .mix(color(0x000066).add(fogNoiseDistance), color(0xffffff));

  const buildGeometry = new Engine.BoxGeometry(1, 1, 1);
  const buildMaterial = new MeshPhongNodeMaterial({
    colorNode: buildWindows,
  });

  const buildMesh = new Engine.InstancedMesh(buildGeometry, buildMaterial, 4000);
  scene.add(buildMesh);

  const dummy = new Engine.Entity();
  const center = new Engine.Vec3();

  for (let i = 0; i < buildMesh.count; i++) {
    const scaleY = Math.random() * 7 + 0.5;

    dummy.position.x = Math.random() * 600 - 300;
    dummy.position.z = Math.random() * 600 - 300;

    const distance = Math.max(dummy.position.distanceTo(center) * 0.012, 1);

    dummy.position.y = 0.5 * scaleY * distance;

    dummy.scale.x = dummy.scale.z = Math.random() * 3 + 0.5;
    dummy.scale.y = scaleY * distance;

    dummy.updateMatrix();

    buildMesh.setMatrixAt(i, dummy.matrix);
  }



  scene.add(new Engine.HemisphereLight(skyColor.value, groundColor.value, 0.5));



  const planeGeometry = new Engine.PlaneGeometry(200, 200);
  const planeMaterial = new Engine.MeshPhongMaterial({
    color: 0x999999,
  });

  const ground = new Engine.Mesh(planeGeometry, planeMaterial);
  ground.setRotationX(-Math.PI / 2);
  ground.scale.scale(3);
  ground.castShadow = true;
  ground.receiveShadow = true;
  scene.add(ground);



  renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);



  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.target.set(0, 2, 0);
  controls.minDistance = 7;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  controls.update();

  useWindowResizer(renderer, camera);
}

function animate() {
  controls.update();

  renderer.render(scene, camera);
}
