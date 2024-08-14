import {
  Attribute,
  Buffer,
  BufferStep,
  GPUBufferBindingTypeType,
  GridVisualizer,
  Hearth,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  OrbitControls,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  TextureLoader,
  Vec2,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import {
  f32,
  hsl,
  instanceIndex,
  NodeStack,
  SpriteNodeMaterial,
  storage,
  texture,
  TypeName,
  uniform,
  vec3,
} from '@modules/renderer/engine/nodes/nodes.js';

import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { MiniUi } from '@mimi/mini-ui';

const count = 1000000;
const gravity = uniform(-0.0098);
const bounce = uniform(0.8);
const friction = uniform(0.99);
const size = uniform(0.12);

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(15, 30, 15);

  return camera;
};
const createBuffer = () => {
  const buffer = Buffer.f32(count * 3, 3, BufferStep.Instance);

  return storage(Attribute.use(buffer, 3, 0, GPUBufferBindingTypeType.Storage), TypeName.vec3, count);
};
const createParticle = async () => {
  const map = await TextureLoader.loadAsync('../../resources/textures/sprite.png');
  const textureNode = texture(map);

  const material = new SpriteNodeMaterial();
  material.colorNode = textureNode.mul(colorBuffer.element(instanceIndex));
  material.positionNode = positionBuffer.toAttribute();
  material.scaleNode = size;
  material.depthWrite = false;
  material.depthTest = true;
  material.transparent = true;

  const particles = new InstancedMesh(new PlaneGeometry(), material, count);
  particles.useFrustumCull = false;

  return particles;
};
const createGrid = () => new GridVisualizer({ size: 100, divisions: 40, centerColor: 0x222222, lineColor: 0x222222 });
const createPlane = () => {
  const geometry = new PlaneGeometry({ width: 1000, height: 1000 }).rotateX(-Math.PI / 2);
  const material = new MeshBasicMaterial({ visible: false });

  return new Mesh(geometry, material);
};

const clickPosition = uniform(Vec3.new());
const camera = createCamera();

const scene = new Scene();

const positionBuffer = createBuffer();
const velocityBuffer = createBuffer();
const colorBuffer = createBuffer();

const computes = {
  onInit: hsl(() => {
    const position = positionBuffer.element(instanceIndex);
    const color = colorBuffer.element(instanceIndex);

    const randX = instanceIndex.hash();
    const randY = instanceIndex.add(2).hash();
    const randZ = instanceIndex.add(3).hash();

    position.x = randX.mul(100).add(-50);
    position.y = 0;
    position.z = randZ.mul(100).add(-50);

    color.assign(vec3(randX, randY, randZ));
  })().compute(count),
  onUpdate: hsl(() => {
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
  })().compute(count),
  onHit: hsl(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);

    const dist = position.distance(clickPosition);
    const direction = position.sub(clickPosition).normalize();
    const distArea = f32(6).sub(dist).max(0);

    const power = distArea.mul(0.01);
    const relativePower = power.mul(instanceIndex.hash().mul(0.5).add(0.5));

    velocity.assign(velocity.add(direction.mul(relativePower)));
  })().compute(count),
};

const particles = await createParticle();
const grid = createGrid();
const plane = createPlane();

scene.add(particles, grid, plane);

const raycaster = Raycaster.new();

const timestamps = document.getElementById('timestamps')!;
const hearth = await Hearth.as({
  trackTimestamp: true,
  async animate() {
    await hearth.compute(computes.onUpdate);
    await hearth.render(scene, camera);

    const { compute, render } = hearth.stats;

    if (hearth.stats.render.passes % 20 === 0) {
      timestamps.innerHTML = `
							Compute ${compute.calls} pass in ${compute.timestampTime.toFixed(2)}ms
							<br>
							Draw ${render.calls} pass in ${render.timestampTime.toFixed(2)}ms`;
    }
  },
});

await hearth.compute(computes.onInit);

const pointer = Vec2.new();
hearth.parameters.canvas.addEventListener('pointermove', async (event: PointerEvent) => {
  pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

  raycaster.fromCamera(pointer, camera);

  const intersects = raycaster.intersects([plane], false);

  if (intersects.length > 0) {
    const { point } = intersects[0];

    clickPosition.value.from(point);
    clickPosition.value.y = -1;

    await hearth.compute(computes.onHit);
  }
});

OrbitControls.attach(hearth, camera);
useWindowResizer(hearth, camera);

MiniUi.create('Controls', { gravity, bounce, friction, size })
  .number('gravity.value', 'Gravity', -0.0098, 0, 0.0001)
  .number('bounce.value', 'Bounce', 0.1, 1, 0.01)
  .number('friction.value', 'Friction', 0.96, 0.99, 0.01)
  .number('size.value', 'Size', 0.12, 0.5, 0.01);
