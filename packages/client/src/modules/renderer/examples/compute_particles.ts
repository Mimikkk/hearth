import * as Engine from '@modules/renderer/engine/engine.js';
import {
  f32,
  instanceIndex,
  NodeStack,
  SpriteNodeMaterial,
  storage,
  texture,
  tslFn,
  uniform,
  vec3,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import StorageInstancedBufferAttribute from '@modules/renderer/engine/core/attributes/StorageInstancedBufferAttribute.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import Stats from 'stats-js';

import { GUI } from 'lil-gui';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const particleCount = 1000000;

const gravity = uniform(-0.0098);
const bounce = uniform(0.8);
const friction = uniform(0.99);
const size = uniform(0.12);

const clickPosition = uniform(new Engine.Vec3());

let camera, scene, renderer: Renderer;
let controls, stats;
let computeParticles;

const timestamps = document.getElementById('timestamps');

init();

async function init() {
  const { innerWidth, innerHeight } = window;

  camera = new Engine.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(15, 30, 15);

  scene = new Engine.Scene();

  // textures

  const textureLoader = new TextureLoader();
  const map = await textureLoader.loadAsync('resources/textures/sprite.png');

  //

  const createBuffer = () =>
    storage(new StorageInstancedBufferAttribute(new Float32Array(particleCount * 3), 3), 'vec3', particleCount);

  const positionBuffer = createBuffer();
  const velocityBuffer = createBuffer();
  const colorBuffer = createBuffer();

  // compute

  const computeInit = tslFn(() => {
    const position = positionBuffer.element(instanceIndex);
    const color = colorBuffer.element(instanceIndex);

    const randX = instanceIndex.hash();
    const randY = instanceIndex.add(2).hash();
    const randZ = instanceIndex.add(3).hash();

    position.x = randX.mul(100).add(-50);
    position.y = 0; // randY.mul( 10 );
    position.z = randZ.mul(100).add(-50);

    color.assign(vec3(randX, randY, randZ));
  })().compute(particleCount);

  //

  const computeUpdate = tslFn(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);

    velocity.addAssign(vec3(0.0, gravity, 0.0));
    position.addAssign(velocity);

    velocity.mulAssign(friction);

    // floor

    NodeStack.if(position.y.lessThan(0), () => {
      position.y = 0;
      velocity.y = velocity.y.negate().mul(bounce);

      // floor friction

      velocity.x = velocity.x.mul(0.9);
      velocity.z = velocity.z.mul(0.9);
    });
  });

  computeParticles = computeUpdate().compute(particleCount);

  // create nodes

  const textureNode = texture(map);

  // create particles

  const particleMaterial = new SpriteNodeMaterial();
  particleMaterial.colorNode = textureNode.mul(colorBuffer.element(instanceIndex));
  particleMaterial.positionNode = positionBuffer.toAttribute();
  particleMaterial.scaleNode = size;
  particleMaterial.depthWrite = false;
  particleMaterial.depthTest = true;
  particleMaterial.transparent = true;

  const particles = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), particleMaterial);
  particles.isInstancedMesh = true;
  particles.count = particleCount;
  particles.frustumCulled = false;
  scene.add(particles);

  //

  const helper = new Engine.GridHelper(60, 40, 0x303030, 0x303030);
  scene.add(helper);

  const geometry = new Engine.PlaneGeometry(1000, 1000);
  geometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(geometry, new Engine.MeshBasicMaterial({ visible: false }));
  scene.add(plane);

  const raycaster = new Engine.Raycaster();
  const pointer = new Engine.Vec2();

  //

  renderer = await Renderer.create({ trackTimestamp: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  renderer.compute(computeInit);

  // click event

  const computeHit = tslFn(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);

    const dist = position.distance(clickPosition);
    const direction = position.sub(clickPosition).normalize();
    const distArea = f32(6).sub(dist).max(0);

    const power = distArea.mul(0.01);
    const relativePower = power.mul(instanceIndex.hash().mul(0.5).add(0.5));

    velocity.assign(velocity.add(direction.mul(relativePower)));
  })().compute(particleCount);

  //

  function onMove(event) {
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

    raycaster.fromCamera(pointer, camera);

    const intersects = raycaster.intersects([plane], false);

    if (intersects.length > 0) {
      const { point } = intersects[0];

      // move to uniform

      clickPosition.value.from(point);
      clickPosition.value.y = -1;

      // compute

      renderer.compute(computeHit);
    }
  }

  // events

  renderer.parameters.canvas.addEventListener('pointermove', onMove);
  //

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 5;
  controls.maxDistance = 200;
  controls.target.set(0, 0, 0);
  controls.update();

  //

  useWindowResizer(renderer, camera);

  // gui

  const gui = new GUI();

  gui.add(gravity, 'value', -0.0098, 0, 0.0001).name('gravity');
  gui.add(bounce, 'value', 0.1, 1, 0.01).name('bounce');
  gui.add(friction, 'value', 0.96, 0.99, 0.01).name('friction');
  gui.add(size, 'value', 0.12, 0.5, 0.01).name('size');
}

async function animate() {
  stats.update();

  await renderer.compute(computeParticles);

  await renderer.render(scene, camera);

  // throttle the logging

  if (renderer.backend.hasFeature('timestamp-query')) {
    if (renderer.info.render.passes % 5 === 0) {
      timestamps.innerHTML = `
							Compute ${renderer.info.compute.calls} pass in ${renderer.info.compute.timestamp.toFixed(6)}ms<br>
							Draw ${renderer.info.render.calls} pass in ${renderer.info.render.timestamp.toFixed(6)}ms`;
    }
  } else {
    timestamps.innerHTML = 'Timestamp queries not supported';
  }
}
