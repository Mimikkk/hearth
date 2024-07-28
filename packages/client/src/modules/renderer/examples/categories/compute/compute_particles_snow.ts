import * as Engine from '@modules/renderer/engine/engine.js';
import { Attribute } from '@modules/renderer/engine/engine.js';
import {
  color,
  instanceIndex,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  NodeStack,
  pass,
  positionLocal,
  positionWorld,
  storage,
  texture,
  timerLocal,
  tslFn,
  u32,
  vec2,
  vec3,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { TeapotGeometry } from '@modules/renderer/engine/objects/geometries/TeapotGeometry.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

import PostProcessing from '@modules/renderer/engine/renderers/PostProcessing.js';

import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { WorldAxesControls } from '@modules/renderer/engine/objects/controls/WorldAxesControls.js';
import { BufferStep, GPUBufferBindingTypeType } from '@modules/renderer/engine/renderers/constants.js';
import { Stats } from '../../ui/stats.js';

const maxParticleCount = 100000;

let camera, scene, renderer;
let viewHelper!: WorldAxesControls;
let controls;
let computeParticles;
let postProcessing;

let collisionCamera, collisionPosRT, collisionPosMaterial;

init();

async function init() {
  const { innerWidth, innerHeight } = window;

  camera = new Engine.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(20, 2, 20);
  camera.layers.enable(2);
  camera.lookAt(0, 40, 0);

  scene = new Engine.Scene();
  scene.fog = new Engine.Fog(0x0f3c37, 5, 40);

  const dirLight = new Engine.DirectionalLight(0xf9ff9b, 9);
  dirLight.castShadow = true;
  dirLight.position.set(10, 10, 0);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.009;
  scene.add(dirLight);

  scene.add(new Engine.HemisphereLight(0x0f3c37, 0x080d10, 100));

  //

  collisionCamera = new Engine.OrthographicCamera(-50, 50, 50, -50, 0.1, 50);
  collisionCamera.position.y = 50;
  collisionCamera.lookAt(0, 0, 0);
  collisionCamera.layers.enable(1);

  collisionPosRT = new Engine.RenderTarget(1024, 1024);
  collisionPosRT.texture.type = Engine.TextureDataType.HalfFloat;

  collisionPosMaterial = new MeshBasicNodeMaterial();
  collisionPosMaterial.fog = false;
  collisionPosMaterial.toneMapped = false;
  collisionPosMaterial.colorNode = positionWorld.y;

  //

  const createBuffer = (type = 'vec3') =>
    storage(
      new Attribute(
        new Float32Array(maxParticleCount * (type === 'vec4' ? 4 : 3)),
        type === 'vec4' ? 4 : 3,
        0,
        BufferStep.Instance,
        GPUBufferBindingTypeType.Storage,
      ),
      type,
      maxParticleCount,
    );

  const positionBuffer = createBuffer();
  const scaleBuffer = createBuffer();
  const staticPositionBuffer = createBuffer();
  const dataBuffer = createBuffer('vec4');

  // compute

  const timer = timerLocal();

  const randUint = () => u32(Math.random() * 0xffffff);

  const computeInit = tslFn(() => {
    const position = positionBuffer.element(instanceIndex);
    const scale = scaleBuffer.element(instanceIndex);
    const particleData = dataBuffer.element(instanceIndex);

    const randX = instanceIndex.hash();
    const randY = instanceIndex.add(randUint()).hash();
    const randZ = instanceIndex.add(randUint()).hash();

    position.x = randX.mul(100).add(-50);
    position.y = randY.mul(500).add(3);
    position.z = randZ.mul(100).add(-50);

    scale.xyz = instanceIndex.add(Math.random()).hash().mul(0.8).add(0.2);

    staticPositionBuffer.element(instanceIndex).assign(vec3(1000, 10000, 1000));

    particleData.y = randY.mul(-0.1).add(-0.02);

    particleData.x = position.x;
    particleData.z = position.z;
    particleData.w = randX;
  })().compute(maxParticleCount);

  //

  const surfaceOffset = 0.2;
  const speed = 0.4;

  const computeUpdate = tslFn(() => {
    const getCoord = pos => pos.add(50).div(100);

    const position = positionBuffer.element(instanceIndex);
    const scale = scaleBuffer.element(instanceIndex);
    const particleData = dataBuffer.element(instanceIndex);

    const velocity = particleData.y;
    const random = particleData.w;

    const rippleOnSurface = texture(collisionPosRT.texture, getCoord(position.xz));
    const rippleFloorArea = rippleOnSurface.y.add(scale.x.mul(surfaceOffset));

    NodeStack.if(position.y.greaterThan(rippleFloorArea), () => {
      position.x = particleData.x.add(timer.mul(random.mul(random)).mul(speed).sin().mul(3));
      position.z = particleData.z.add(timer.mul(random).mul(speed).cos().mul(random.mul(10)));

      position.y = position.y.add(velocity);
    }).else(() => {
      staticPositionBuffer.element(instanceIndex).assign(position);
    });
  });

  computeParticles = computeUpdate().compute(maxParticleCount);

  // rain

  const geometry = new Engine.SphereGeometry(surfaceOffset, 5, 5);

  function particle(staticParticles) {
    const posBuffer = staticParticles ? staticPositionBuffer : positionBuffer;
    const layer = staticParticles ? 1 : 2;

    const staticMaterial = new MeshStandardNodeMaterial({
      color: 0xeeeeee,
      roughness: 0.9,
      metalness: 0,
    });

    staticMaterial.positionNode = positionLocal.mul(scaleBuffer.toAttribute()).add(posBuffer.toAttribute());

    const rainParticles = new Engine.Mesh(geometry, staticMaterial);
    rainParticles.isInstancedMesh = true;
    rainParticles.count = maxParticleCount;
    rainParticles.castShadow = true;
    rainParticles.layers.disableAll();
    rainParticles.layers.enable(layer);

    return rainParticles;
  }

  const dynamicParticles = particle();
  const staticParticles = particle(true);

  scene.add(dynamicParticles);
  scene.add(staticParticles);

  // floor geometry

  const floorGeometry = new Engine.PlaneGeometry(100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(
    floorGeometry,
    new Engine.MeshStandardMaterial({
      color: 0x0c1e1e,
      roughness: 0.5,
      metalness: 0,
      transparent: true,
    }),
  );

  plane.material.opacityNode = positionLocal.xz.mul(0.05).distance(0).saturate().oneMinus();

  scene.add(plane);

  // tree

  function tree(count = 8) {
    const coneMaterial = new MeshStandardNodeMaterial({
      color: 0x0d492c,
      roughness: 0.6,
      metalness: 0,
    });

    const object = new Engine.Group();

    for (let i = 0; i < count; i++) {
      const radius = 1 + i;

      const coneGeometry = new Engine.ConeGeometry(radius * 0.95, radius * 1.25, 32);

      const cone = new Engine.Mesh(coneGeometry, coneMaterial);
      cone.castShadow = true;
      cone.position.y = (count - i) * 1.5 + count * 0.6;
      object.add(cone);
    }

    const geometry = new Engine.CylinderGeometry(1, 1, count, 32);
    const cone = new Engine.Mesh(geometry, coneMaterial);
    cone.position.y = count / 2;
    object.add(cone);

    return object;
  }

  const teapotTree = new Engine.Mesh(
    new TeapotGeometry(0.5, 18),
    new MeshBasicNodeMaterial({
      color: 0xfcfb9e,
    }),
  );

  teapotTree.position.y = 18;

  scene.add(tree());
  scene.add(teapotTree);

  //

  scene.backgroundNode = viewportTopLeft.distance(0.5).mul(2).mix(color(0x0f4140), color(0x060a0d));

  renderer = await Renderer.as();
  //

  viewHelper = new WorldAxesControls(camera, renderer.parameters.canvas);
  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.target.set(0, 10, 0);
  controls.minDistance = 25;
  controls.maxDistance = 35;
  controls.maxPolarAngle = Math.PI / 1.7;
  controls.autoRotate = true;
  controls.autoRotateSpeed = -0.7;
  controls.update();

  // post processing

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();
  const vignet = viewportTopLeft.distance(0.5).mul(1.35).clamp().oneMinus();

  const teapotTreePass = pass(teapotTree, camera).getTextureNode();
  const teapotTreePassBlurred = teapotTreePass.gaussianBlur(3);
  teapotTreePassBlurred.resolution = new Engine.Vec2(0.2, 0.2);

  const scenePassColorBlurred = scenePassColor.gaussianBlur();
  scenePassColorBlurred.resolution = new Engine.Vec2(0.5, 0.5);
  scenePassColorBlurred.directionNode = vec2(1);

  // compose

  let totalPass = scenePass;
  totalPass = totalPass.add(scenePassColorBlurred.mul(0.1));
  totalPass = totalPass.mul(vignet);
  totalPass = totalPass.add(teapotTreePass.mul(10).add(teapotTreePassBlurred));

  //

  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = async () => {
    stats?.update();
    controls?.update();

    // position

    scene.overrideMaterial = collisionPosMaterial;
    renderer.updateRenderTarget(collisionPosRT);
    await renderer.render(scene, collisionCamera);

    // compute

    await renderer.compute(computeParticles);

    // result

    scene.overrideMaterial = null;
    renderer.updateRenderTarget(null);

    await postProcessing.render();
  };
  document.body.appendChild(renderer.parameters.canvas);

  postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = totalPass;

  const stats = Stats.use(renderer);
  await renderer.compute(computeInit);

  //

  useWindowResizer(renderer, camera);
}
