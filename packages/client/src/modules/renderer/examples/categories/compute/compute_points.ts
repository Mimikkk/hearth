import { Attribute, Buffer, Geometry, OrthographicCamera, Points, Scene, Vec2 } from '@mimi/hearth';
import {
  attribute,
  color,
  f32,
  hsl,
  instanceIndex,
  PointsNodeMaterial,
  storage,
  uniform,
  vec2,
  vec3,
} from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { BufferStep, GPUBufferBindingTypeType } from '@mimi/hearth';
import { TypeName } from '@mimi/hearth';
import { MiniUi } from '@mimi/mini-ui';

const count = 300000;
const mouse = Vec2.new(-10.0, -10.0);
const scale = Vec2.new(1, 1);

const createCamera = () => {
  const camera = new OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0, 1);
  camera.position.z = 1;

  return camera;
};
const createStorageNode = () => {
  const buffer = Buffer.f32(count * 2, 2, BufferStep.Instance);
  const attribute = Attribute.use(buffer, 2, 0, GPUBufferBindingTypeType.Storage);

  return storage(attribute, TypeName.vec2, count);
};
const createStorageNodes = () => {
  const particle = createStorageNode();
  const velocity = createStorageNode();

  return { particle, velocity };
};
const createPoints = () => {
  const geometry = new Geometry();

  geometry.attributes.position = Attribute.use(Buffer.f32(3, 3));
  geometry.attributes.particle = particleBufferNode.value;
  geometry.drawRange.count = 1;

  const material = new PointsNodeMaterial();
  material.colorNode = particle.add(color(0xffffff));
  material.positionNode = particle;

  const mesh = new Points(geometry, material);
  mesh.count = count;

  return mesh;
};

const { particle: particleBufferNode, velocity: velocityBufferNode } = createStorageNodes();

const onUpdate = hsl(() => {
  const particle = particleBufferNode.element(instanceIndex);
  const velocity = velocityBufferNode.element(instanceIndex);

  const pointer = uniform(mouse);
  const limit = uniform(scale);

  const position = particle.add(velocity);
  velocity.x = position.x.abs().greaterThanEqual(limit.x).cond(velocity.x.negate(), velocity.x);
  velocity.y = position.y.abs().greaterThanEqual(limit.y).cond(velocity.y.negate(), velocity.y);

  position.assign(position.min(limit).max(limit.negate()));

  const pointerSize = 0.1;
  const distanceFromPointer = pointer.sub(position).length();

  particle.assign(distanceFromPointer.lessThanEqual(pointerSize).cond(vec3(), position));
})().compute(count);
const onInit = hsl(() => {
  const particleIndex = f32(instanceIndex);

  const randomAngle = particleIndex.mul(0.005).mul(Math.PI * 2);
  const randomSpeed = particleIndex.mul(0.00000001).add(0.0000001);

  const velX = randomAngle.sin().mul(randomSpeed);
  const velY = randomAngle.cos().mul(randomSpeed);

  const velocity = velocityBufferNode.element(instanceIndex);

  velocity.xy = vec2(velX, velY);
})().compute(count);

const particle = attribute('particle', TypeName.vec2);
const points = createPoints();
const scene = Scene.of(points);
const camera = createCamera();

const hearth = await Hearth.as({
  async animate() {
    await hearth.compute(onUpdate);
    await hearth.render(scene, camera);
  },
});
await hearth.compute(onInit);

useWindowResizer(hearth, camera);
window.addEventListener('mousemove', event => {
  const x = event.clientX;
  const y = event.clientY;

  const width = window.innerWidth;
  const height = window.innerHeight;

  mouse.set((x / width - 0.5) * 2.0, (-y / height + 0.5) * 2.0);
});

MiniUi.create('Controls', { scale }).number('scale.x', 'Scale X', 0, 1, 0.01).number('scale.y', 'Scale Y', 0, 1, 0.01);
