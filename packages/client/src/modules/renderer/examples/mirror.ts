import * as Engine from '@modules/renderer/engine/engine.js';
import { color, MeshPhongNodeMaterial, reflector, texture, uv } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

let cameraControls;

let sphereGroup, smallSphere;

init();

async function init() {
  // scene
  scene = new Engine.Scene();

  // camera
  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 75, 160);

  //

  let geometry, material;

  //

  sphereGroup = new Engine.Object3D();
  scene.add(sphereGroup);

  geometry = new Engine.CylinderGeometry(0.1, 15 * Math.cos((Math.PI / 180) * 30), 0.1, 24, 1);
  material = new Engine.MeshPhongMaterial({ color: 0xffffff, emissive: 0x8d8d8d });
  const sphereCap = new Engine.Mesh(geometry, material);
  sphereCap.position.y = -15 * Math.sin((Math.PI / 180) * 30) - 0.05;
  sphereCap.rotateX(-Math.PI);

  geometry = new Engine.SphereGeometry(15, 24, 24, Math.PI / 2, Math.PI * 2, 0, (Math.PI / 180) * 120);
  const halfSphere = new Engine.Mesh(geometry, material);
  halfSphere.add(sphereCap);
  halfSphere.rotateX((-Math.PI / 180) * 135);
  halfSphere.rotateZ((-Math.PI / 180) * 20);
  halfSphere.position.y = 7.5 + 15 * Math.sin((Math.PI / 180) * 30);

  sphereGroup.add(halfSphere);

  geometry = new Engine.IcosahedronGeometry(5, 0);
  material = new Engine.MeshPhongMaterial({ color: 0xffffff, emissive: 0x7b7b7b, flatShading: true });
  smallSphere = new Engine.Mesh(geometry, material);
  scene.add(smallSphere);

  // textures

  const textureLoader = new TextureLoader();

  const floorNormal = await textureLoader.loadAsync('resources/textures/floors/FloorsCheckerboard_S_Normal.jpg');
  floorNormal.wrapS = Engine.Wrapping.Repeat;
  floorNormal.wrapT = Engine.Wrapping.Repeat;

  const decalDiffuse = await textureLoader.loadAsync('resources/textures/decal/decal-diffuse.png');
  decalDiffuse.colorSpace = Engine.ColorSpace.SRGB;

  const decalNormal = await textureLoader.loadAsync('resources/textures/decal/decal-normal.jpg');

  // reflectors / mirrors

  const groundReflector = reflector();
  const verticalReflector = reflector();

  const groundNormalScale = -0.08;
  const verticalNormalScale = 0.1;

  const groundUVOffset = texture(decalNormal).xy.mul(2).sub(1).mul(groundNormalScale);
  const verticalUVOffset = texture(floorNormal, uv().mul(5)).xy.mul(2).sub(1).mul(verticalNormalScale);

  groundReflector.uvNode = groundReflector.uvNode.add(groundUVOffset);
  verticalReflector.uvNode = verticalReflector.uvNode.add(verticalUVOffset);

  const groundNode = texture(decalDiffuse).a.mix(color(0xffffff), groundReflector);
  const verticalNode = color(0x0000ff).mul(0.1).add(verticalReflector);

  // walls

  const planeGeo = new Engine.PlaneGeometry(100.1, 100.1);

  //

  const planeBottom = new Engine.Mesh(
    planeGeo,
    new MeshPhongNodeMaterial({
      colorNode: groundNode,
    }),
  );
  planeBottom.rotateX(-Math.PI / 2);
  planeBottom.add(groundReflector.target);
  scene.add(planeBottom);

  const planeBack = new Engine.Mesh(
    planeGeo,
    new MeshPhongNodeMaterial({
      colorNode: verticalNode,
    }),
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
  planeBack.add(verticalReflector.target);
  scene.add(planeBack);

  //

  const planeTop = new Engine.Mesh(planeGeo, new Engine.MeshPhongMaterial({ color: 0xffffff }));
  planeTop.position.y = 100;
  planeTop.rotateX(Math.PI / 2);
  scene.add(planeTop);

  const planeFront = new Engine.Mesh(planeGeo, new Engine.MeshPhongMaterial({ color: 0x7f7fff }));
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const planeRight = new Engine.Mesh(planeGeo, new Engine.MeshPhongMaterial({ color: 0x00ff00 }));
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  const planeLeft = new Engine.Mesh(planeGeo, new Engine.MeshPhongMaterial({ color: 0xff0000 }));
  planeLeft.position.x = -50;
  planeLeft.position.y = 50;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  // lights

  const mainLight = new Engine.PointLight(0xe7e7e7, 2.5, 250, 0);
  mainLight.position.y = 60;
  scene.add(mainLight);

  const greenLight = new Engine.PointLight(0x00ff00, 0.5, 1000, 0);
  greenLight.position.set(550, 50, 0);
  scene.add(greenLight);

  const redLight = new Engine.PointLight(0xff0000, 0.5, 1000, 0);
  redLight.position.set(-550, 50, 0);
  scene.add(redLight);

  const blueLight = new Engine.PointLight(0xbbbbfe, 0.5, 1000, 0);
  blueLight.position.set(0, 50, 550);
  scene.add(blueLight);

  // renderer

  renderer = await Renderer.create();
  renderer._animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  // controls

  cameraControls = new OrbitControls(camera, renderer.parameters.canvas);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.update();

  useWindowResizer(renderer, camera);
}

function animate() {
  const timer = Date.now() * 0.01;

  sphereGroup.rotateY(-0.002);

  smallSphere.position.set(
    Math.cos(timer * 0.1) * 30,
    Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
    Math.sin(timer * 0.1) * 30,
  );

  smallSphere.setRotation(0, Math.PI / 2 - timer * 0.1, timer * 0.8);

  renderer.render(scene, camera);
}
