import * as Engine from '@modules/renderer/engine/engine.js';
import { Attribute } from '@modules/renderer/engine/engine.js';
import {
  f32,
  instanceIndex,
  NodeStack,
  SpriteNodeMaterial,
  storage,
  texture,
  hsl,
  uniform,
  vec3,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

import { GUI } from 'lil-gui';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { GPUBufferBindingTypeType, BufferStep } from '@modules/renderer/engine/hearth/constants.js';

const particleCount = 1000000;

const gravity = uniform(-0.0098);
const bounce = uniform(0.8);
const friction = uniform(0.99);
const size = uniform(0.12);

const clickPosition = uniform(new Engine.Vec3());

let camera, scene, hearth: Hearth;
let controls;
let computeParticles;

const timestamps = document.getElementById('timestamps');

init();

async function init() {
  const { innerWidth, innerHeight } = window;

  camera = new Engine.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(15, 30, 15);

  scene = new Engine.Scene();

  const textureLoader = new TextureLoader();
  const map = await textureLoader.loadAsync('../../resources/textures/sprite.png');

  const createBuffer = () =>
    storage(
      new Attribute(new Float32Array(particleCount * 3), 3, 0, BufferStep.Instance, GPUBufferBindingTypeType.Storage),
      'vec3',
      particleCount,
    );

  const positionBuffer = createBuffer();
  const velocityBuffer = createBuffer();
  const colorBuffer = createBuffer();

  const computeInit = hsl(() => {
    const position = positionBuffer.element(instanceIndex);
    const color = colorBuffer.element(instanceIndex);

    const randX = instanceIndex.hash();
    const randY = instanceIndex.add(2).hash();
    const randZ = instanceIndex.add(3).hash();

    position.x = randX.mul(100).add(-50);
    position.y = 0;
    position.z = randZ.mul(100).add(-50);

    color.assign(vec3(randX, randY, randZ));
  })().compute(particleCount);

  const computeUpdate = hsl(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);

    velocity.addAssign(vec3(0.0, gravity, 0.0));
    position.addAssign(velocity);

    velocity.mulAssign(friction);

    NodeStack.if(position.y.lessThan(0), () => {
      position.y = 0;
      velocity.y = velocity.y.negate().mul(bounce);

      velocity.x = velocity.x.mul(0.9);
      velocity.z = velocity.z.mul(0.9);
    });
  });

  computeParticles = computeUpdate().compute(particleCount);

  const textureNode = texture(map);

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

  const helper = new Engine.GridHelper(60, 40, 0x303030, 0x303030);
  scene.add(helper);

  const geometry = new Engine.PlaneGeometry(1000, 1000);
  geometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(geometry, new Engine.MeshBasicMaterial({ visible: false }));
  scene.add(plane);

  const raycaster = new Engine.Raycaster();
  const pointer = new Engine.Vec2();

  hearth = await Hearth.as({ trackTimestamp: true });
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  hearth.compute(computeInit);

  const computeHit = hsl(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);

    const dist = position.distance(clickPosition);
    const direction = position.sub(clickPosition).normalize();
    const distArea = f32(6).sub(dist).max(0);

    const power = distArea.mul(0.01);
    const relativePower = power.mul(instanceIndex.hash().mul(0.5).add(0.5));

    velocity.assign(velocity.add(direction.mul(relativePower)));
  })().compute(particleCount);

  function onMove(event) {
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

    raycaster.fromCamera(pointer, camera);

    const intersects = raycaster.intersects([plane], false);

    if (intersects.length > 0) {
      const { point } = intersects[0];

      clickPosition.value.from(point);
      clickPosition.value.y = -1;

      hearth.compute(computeHit);
    }
  }

  hearth.parameters.canvas.addEventListener('pointermove', onMove);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 5;
  controls.maxDistance = 200;
  controls.target.set(0, 0, 0);
  controls.update();

  useWindowResizer(hearth, camera);

  const gui = new GUI();

  gui.add(gravity, 'value', -0.0098, 0, 0.0001).name('gravity');
  gui.add(bounce, 'value', 0.1, 1, 0.01).name('bounce');
  gui.add(friction, 'value', 0.96, 0.99, 0.01).name('friction');
  gui.add(size, 'value', 0.12, 0.5, 0.01).name('size');
}

async function animate() {
  await hearth.compute(computeParticles);

  await hearth.render(scene, camera);

  if (hearth.hasFeature('timestamp-query')) {
    if (hearth.stats.render.passes % 5 === 0) {
      timestamps.innerHTML = `
							Compute ${hearth.stats.compute.calls} pass in ${hearth.stats.compute.timestampTime.toFixed(6)}ms<br>
							Draw ${hearth.stats.render.calls} pass in ${hearth.stats.render.timestampTime.toFixed(6)}ms`;
    }
  } else {
    timestamps.innerHTML = 'Timestamp queries not supported';
  }
}
