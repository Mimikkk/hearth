import * as Engine from '@modules/renderer/engine/engine.js';
import {
  cameraProjectionMatrix,
  cameraViewMatrix,
  instanceIndex,
  MeshBasicNodeMaterial,
  modelWorldMatrix,
  NodeStack,
  positionGeometry,
  positionWorld,
  storage,
  texture,
  timerDelta,
  timerLocal,
  tslFn,
  u32,
  uv,
  vec2,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import StorageInstancedBufferAttribute from '@modules/renderer/engine/renderers/common/StorageInstancedBufferAttribute.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import Stats from 'stats-js';

import { GUI } from 'lil-gui';

import * as BufferGeometryUtils from '@modules/renderer/engine/utils/BufferGeometryUtils.js';
import { BufferGeometryLoader } from '@modules/renderer/engine/loaders/geometries/BufferGeometryLoader/BufferGeometryLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const maxParticleCount = 50000;
const instanceCount = maxParticleCount / 2;

let camera, scene, renderer;
let controls, stats;
let computeParticles;
let monkey;
let clock;

let collisionBox, collisionCamera, collisionPosRT, collisionPosMaterial;
let collisionBoxPos, collisionBoxPosUI;

init();

async function init() {
  const { innerWidth, innerHeight } = window;

  camera = new Engine.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 110);
  camera.position.set(40, 8, 0);
  camera.lookAt(0, 0, 0);

  scene = new Engine.Scene();

  const dirLight = new Engine.DirectionalLight(0xffffff, 0.5);
  dirLight.castShadow = true;
  dirLight.position.set(3, 17, 17);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.01;

  scene.add(dirLight);
  scene.add(new Engine.AmbientLight(0x111111));

  //

  collisionCamera = new Engine.OrthographicCamera(-50, 50, 50, -50, 0.1, 50);
  collisionCamera.position.y = 50;
  collisionCamera.lookAt(0, 0, 0);
  collisionCamera.layers.disableAll();
  collisionCamera.layers.enable(1);

  collisionPosRT = new Engine.RenderTarget(1024, 1024);
  collisionPosRT.texture.type = Engine.TextureDataType.HalfFloat;

  collisionPosMaterial = new MeshBasicNodeMaterial();
  collisionPosMaterial.colorNode = positionWorld;

  //

  const createBuffer = (type = 'vec3') =>
    storage(new StorageInstancedBufferAttribute(maxParticleCount, 3), type, maxParticleCount);

  const positionBuffer = createBuffer();
  const velocityBuffer = createBuffer();
  const ripplePositionBuffer = createBuffer();
  const rippleTimeBuffer = createBuffer();

  // compute

  const timer = timerLocal();

  const randUint = () => u32(Math.random() * 0xffffff);

  const computeInit = tslFn(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const rippleTime = rippleTimeBuffer.element(instanceIndex);

    const randX = instanceIndex.hash();
    const randY = instanceIndex.add(randUint()).hash();
    const randZ = instanceIndex.add(randUint()).hash();

    position.x = randX.mul(100).add(-50);
    position.y = randY.mul(25);
    position.z = randZ.mul(100).add(-50);

    velocity.y = randX.mul(-0.04).add(-0.2);

    rippleTime.x = 1000;
  })().compute(maxParticleCount);

  //

  const computeUpdate = tslFn(() => {
    const getCoord = pos => pos.add(50).div(100);

    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const ripplePosition = ripplePositionBuffer.element(instanceIndex);
    const rippleTime = rippleTimeBuffer.element(instanceIndex);

    position.addAssign(velocity);

    rippleTime.x = rippleTime.x.add(timerDelta().mul(4));

    //

    const collisionArea = texture(collisionPosRT.texture, getCoord(position.xz));

    const surfaceOffset = 0.05;

    const floorPosition = collisionArea.y.add(surfaceOffset);

    // floor

    const ripplePivotOffsetY = -0.9;

    NodeStack.if(position.y.add(ripplePivotOffsetY).lessThan(floorPosition), () => {
      position.y = 25;

      ripplePosition.xz = position.xz;
      ripplePosition.y = floorPosition;

      // reset hit time: x = time

      rippleTime.x = 1;

      // next drops will not fall in the same place

      position.x = instanceIndex.add(timer).hash().mul(100).add(-50);
      position.z = instanceIndex.add(timer.add(randUint())).hash().mul(100).add(-50);
    });

    const rippleOnSurface = texture(collisionPosRT.texture, getCoord(ripplePosition.xz));

    const rippleFloorArea = rippleOnSurface.y.add(surfaceOffset);

    NodeStack.if(ripplePosition.y.greaterThan(rippleFloorArea), () => {
      rippleTime.x = 1000;
    });
  });

  computeParticles = computeUpdate().compute(maxParticleCount);

  // rain

  const billboarding = tslFn(() => {
    const particlePosition = positionBuffer.toAttribute();

    const worldMatrix = modelWorldMatrix.toVar();
    worldMatrix[3][0] = particlePosition.x;
    worldMatrix[3][1] = particlePosition.y;
    worldMatrix[3][2] = particlePosition.z;

    const modelViewMatrix = cameraViewMatrix.mul(worldMatrix);
    modelViewMatrix[0][0] = 1;
    modelViewMatrix[0][1] = 0;
    modelViewMatrix[0][2] = 0;

    //modelViewMatrix[ 0 ][ 0 ] = modelWorldMatrix[ 0 ].length();
    //modelViewMatrix[ 1 ][ 1 ] = modelWorldMatrix[ 1 ].length();

    modelViewMatrix[2][0] = 0;
    modelViewMatrix[2][1] = 0;
    modelViewMatrix[2][2] = 1;

    return cameraProjectionMatrix.mul(modelViewMatrix).mul(positionGeometry);
  });

  const rainMaterial = new MeshBasicNodeMaterial();
  rainMaterial.colorNode = uv().distance(vec2(0.5, 0)).oneMinus().mul(3).exp().mul(0.1);
  rainMaterial.vertexNode = billboarding();
  rainMaterial.opacity = 0.2;
  rainMaterial.side = Engine.Side.Double;
  rainMaterial.forceSinglePass = true;
  rainMaterial.depthWrite = false;
  rainMaterial.depthTest = true;
  rainMaterial.transparent = true;

  const rainParticles = new Engine.Mesh(new Engine.PlaneGeometry(0.1, 2), rainMaterial);
  rainParticles.isInstancedMesh = true;
  rainParticles.count = instanceCount;
  scene.add(rainParticles);

  // ripple

  const rippleTime = rippleTimeBuffer.element(instanceIndex).x;

  const rippleEffect = tslFn(() => {
    const center = uv().add(vec2(-0.5)).length().mul(7);
    const distance = rippleTime.sub(center);

    return distance.min(1).sub(distance.max(1).sub(1));
  });

  const rippleMaterial = new MeshBasicNodeMaterial();
  rippleMaterial.colorNode = rippleEffect();
  rippleMaterial.positionNode = positionGeometry.add(ripplePositionBuffer.toAttribute());
  rippleMaterial.opacityNode = rippleTime.mul(0.3).oneMinus().max(0).mul(0.5);
  rippleMaterial.side = Engine.Side.Double;
  rippleMaterial.forceSinglePass = true;
  rippleMaterial.depthWrite = false;
  rippleMaterial.depthTest = true;
  rippleMaterial.transparent = true;

  // ripple geometry

  const surfaceRippleGeometry = new Engine.PlaneGeometry(2.5, 2.5);
  surfaceRippleGeometry.rotateX(-Math.PI / 2);

  const xRippleGeometry = new Engine.PlaneGeometry(1, 2);
  xRippleGeometry.rotateY(-Math.PI / 2);

  const zRippleGeometry = new Engine.PlaneGeometry(1, 2);

  const rippleGeometry = BufferGeometryUtils.mergeGeometries([surfaceRippleGeometry, xRippleGeometry, zRippleGeometry]);

  const rippleParticles = new Engine.Mesh(rippleGeometry, rippleMaterial);
  rippleParticles.isInstancedMesh = true;
  rippleParticles.count = instanceCount;
  scene.add(rippleParticles);

  // floor geometry

  const floorGeometry = new Engine.PlaneGeometry(1000, 1000);
  floorGeometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(floorGeometry, new Engine.MeshBasicMaterial({ color: 0x050505 }));
  scene.add(plane);

  //

  collisionBox = new Engine.Mesh(new Engine.BoxGeometry(30, 1, 15), new Engine.MeshStandardMaterial());
  collisionBox.material.color.set(0x333333);
  collisionBox.position.y = 12;
  collisionBox.scale.x = 3.5;
  collisionBox.layers.enable(1);
  collisionBox.castShadow = true;
  scene.add(collisionBox);

  //

  const loader = new BufferGeometryLoader();
  loader.loadAsync('resources/models/json/suzanne_buffergeometry.json').then(function (geometry) {
    geometry.computeVertexNormals();

    monkey = new Engine.Mesh(geometry, new Engine.MeshStandardMaterial({ roughness: 1, metalness: 0 }));
    monkey.receiveShadow = true;
    monkey.scale.setScalar(5);
    monkey.setRotationY(Math.PI / 2);
    monkey.position.y = 4.5;
    monkey.layers.enable(1); // add to collision layer

    scene.add(monkey);
  });

  //

  clock = new Engine.Clock();

  //

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.parameters.canvas);
  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  renderer.computeAsync(computeInit);

  //

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 5;
  controls.maxDistance = 50;
  controls.update();

  //

  useWindowResizer(renderer, camera);

  // gui

  const gui = new GUI();

  // use lerp to smooth the movement
  collisionBoxPosUI = new Engine.Vec3().from(collisionBox.position);
  collisionBoxPos = new Engine.Vec3();

  gui.add(collisionBoxPosUI, 'z', -50, 50, 0.001).name('position');
  gui.add(collisionBox.scale, 'x', 0.1, 3.5, 0.01).name('scale');
  gui
    .add(rainParticles, 'count', 200, maxParticleCount, 1)
    .name('drop count')
    .onChange(v => (rippleParticles.count = v));
}

function animate() {
  stats.update();

  const delta = clock.tick();

  if (monkey) {
    monkey.rotateY(delta);
  }

  collisionBoxPos.set(collisionBoxPosUI.x, collisionBoxPosUI.y, -collisionBoxPosUI.z);

  collisionBox.position.lerp(collisionBoxPos, 10 * delta);

  // position

  scene.overrideMaterial = collisionPosMaterial;
  renderer.setRenderTarget(collisionPosRT);
  renderer.render(scene, collisionCamera);

  // compute

  renderer.computeAsync(computeParticles);

  // result

  scene.overrideMaterial = null;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}
