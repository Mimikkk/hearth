import {
  AmbientLight,
  Attribute,
  BoxGeometry,
  Buffer,
  BufferStep,
  Clock,
  DirectionalLight,
  GeometryLoader,
  GeometryUtils,
  GPUBufferBindingTypeType,
  Hearth,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RenderTarget,
  Scene,
  Side,
  TextureDataType,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import {
  cameraProjectionMatrix,
  cameraViewMatrix,
  hsl,
  instanceIndex,
  MeshBasicNodeMaterial,
  modelWorldMatrix,
  Node,
  NodeStack,
  positionGeometry,
  positionWorld,
  storage,
  texture,
  timerDelta,
  timerLocal,
  TypeName,
  u32,
  uv,
  vec2,
} from '@modules/renderer/engine/nodes/nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { MiniUi } from '@mimi/mini-ui';

const maxCount = 50000;

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(40, 8, 0);
  camera.lookAt(0, 0, 0);
  return camera;
};
const createDirectionalLight = () => {
  const light = new DirectionalLight(0xffffff, 0.5);
  light.useShadowCast = true;
  light.position.set(3, 17, 17);
  light.useShadowCast = true;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 50;
  light.shadow.camera.right = 25;
  light.shadow.camera.left = -25;
  light.shadow.camera.top = 25;
  light.shadow.camera.bottom = -25;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.01;

  return light;
};
const createAmbientLight = () => new AmbientLight(0x111111);
const createCollisionCamera = () => {
  const camera = new OrthographicCamera(-50, 50, 50, -50, 0.1, 50);
  camera.position.y = 50;
  camera.lookAt(0, 0, 0);
  camera.layers.disableAll();
  camera.layers.enable(1);

  return camera;
};
const createBuffer = () =>
  storage(
    Attribute.use(Buffer.f32(maxCount * 3, 3, BufferStep.Instance), 3, 0, GPUBufferBindingTypeType.Storage),
    TypeName.vec3,
    maxCount,
  );

const createRainParticles = () => {
  const billboarding = hsl(() => {
    const particlePosition = positionBuffer.toAttribute();

    const worldMatrix = modelWorldMatrix.toVar();
    worldMatrix[3][0] = particlePosition.x;
    worldMatrix[3][1] = particlePosition.y;
    worldMatrix[3][2] = particlePosition.z;

    const modelViewMatrix = cameraViewMatrix.mul(worldMatrix);
    modelViewMatrix[0][0] = 1;
    modelViewMatrix[0][1] = 0;
    modelViewMatrix[0][2] = 0;

    // modelViewMatrix[0][0] = modelWorldMatrix[0].length();
    // modelViewMatrix[1][1] = modelWorldMatrix[1].length();

    modelViewMatrix[2][0] = 0;
    modelViewMatrix[2][1] = 0;
    modelViewMatrix[2][2] = 1;

    return cameraProjectionMatrix.mul(modelViewMatrix).mul(positionGeometry);
  });

  const material = new MeshBasicNodeMaterial();
  material.colorNode = uv().distance(vec2(0.5, 0)).oneMinus().mul(3).exp().mul(0.1);
  material.vertexNode = billboarding();
  material.opacity = 0.2;
  material.side = Side.Double;
  material.depthWrite = false;
  material.depthTest = true;
  material.transparent = true;

  const mesh = new Mesh(new PlaneGeometry({ width: 0.1, height: 2 }), material);
  mesh.isInstancedMesh = true;
  mesh.count = maxCount / 2;

  return mesh;
};
const createRainRipples = () => {
  const time = rippleTimeBuffer.element(instanceIndex).x;
  const effect = hsl(() => {
    const center = uv().add(vec2(-0.5)).length().mul(7);
    const distance = time.sub(center);

    return distance.min(1).sub(distance.max(1).sub(1));
  });

  const material = new MeshBasicNodeMaterial();
  material.colorNode = effect();
  material.positionNode = positionGeometry.add(ripplePositionBuffer.toAttribute());
  material.opacityNode = time.mul(0.3).oneMinus().max(0).mul(0.5);
  material.side = Side.Double;
  material.depthWrite = false;
  material.depthTest = true;
  material.transparent = true;

  const surface = new PlaneGeometry({ width: 2.5, height: 2.5 }).rotateX(-Math.PI / 2);
  const xRipple = new PlaneGeometry({ width: 1, height: 2 }).rotateY(-Math.PI / 2);
  const zRipple = new PlaneGeometry({ width: 1, height: 2 });

  const geometry = GeometryUtils.mergeGeometries([surface, xRipple, zRipple]);

  const mesh = new Mesh(geometry, material);
  mesh.isInstancedMesh = true;
  mesh.count = maxCount / 2;

  return mesh;
};
const createFloor = () => {
  const geometry = new PlaneGeometry({ width: 1000, height: 1000 }).rotateX(-Math.PI / 2);
  const material = new MeshBasicMaterial({ color: 0x050505 });

  return new Mesh(geometry, material);
};
const createRoof = () => {
  const geometry = new BoxGeometry(30, 1, 15);
  const material = new MeshStandardMaterial();
  material.color.set(0x333333);

  const roof = new Mesh(geometry, material);
  roof.position.y = 12;
  roof.scale.x = 3.5;
  roof.layers.enable(1);
  roof.useShadowCast = true;

  return roof;
};
const loadSuzanne = async () => {
  const geometry = await GeometryLoader.loadAsync('../../resources/models/json/suzanne_buffergeometry.json');
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, new MeshStandardMaterial({ roughness: 1, metalness: 0 }));
  mesh.useShadowReceive = true;
  mesh.scale.setScalar(5);
  mesh.setRotationY(Math.PI / 2);
  mesh.position.y = 4.5;
  mesh.layers.enable(1);

  return mesh;
};

const collisionPostprocessTarget = new RenderTarget(1024, 1024);
collisionPostprocessTarget.texture.type = TextureDataType.HalfFloat;
const collisionPostprocessMaterial = new MeshBasicNodeMaterial();
collisionPostprocessMaterial.colorNode = positionWorld;
const collisionPostprocessPosition = new Vec3();

const positionBuffer = createBuffer();
const velocityBuffer = createBuffer();
const ripplePositionBuffer = createBuffer();
const rippleTimeBuffer = createBuffer();

const timer = timerLocal(1);
const randU32 = () => u32(Math.random() * 0xffffff);
const onInit = hsl(() => {
  const position = positionBuffer.element(instanceIndex);
  const velocity = velocityBuffer.element(instanceIndex);
  const rippleTime = rippleTimeBuffer.element(instanceIndex);

  const randX = instanceIndex.hash();
  const randY = instanceIndex.add(randU32()).hash();
  const randZ = instanceIndex.add(randU32()).hash();

  position.x = randX.mul(100).add(-50);
  position.y = randY.mul(25);
  position.z = randZ.mul(100).add(-50);

  velocity.y = randX.mul(-0.04).add(-0.2);

  rippleTime.x = 1000;
})().compute(maxCount);
const onUpdate = hsl(() => {
  const getCoord = (pos: Node) => pos.add(50).div(100);

  const position = positionBuffer.element(instanceIndex);
  const velocity = velocityBuffer.element(instanceIndex);
  const ripplePosition = ripplePositionBuffer.element(instanceIndex);
  const rippleTime = rippleTimeBuffer.element(instanceIndex);

  position.addAssign(velocity);

  rippleTime.x = rippleTime.x.add(timerDelta().mul(4));

  const collisionArea = texture(collisionPostprocessTarget.texture, getCoord(position.xz));

  const surfaceOffset = 0.05;

  const floorPosition = collisionArea.y.add(surfaceOffset);

  const ripplePivotOffsetY = -0.9;

  NodeStack.if(position.y.add(ripplePivotOffsetY).lessThan(floorPosition), () => {
    position.y = 25;

    ripplePosition.xz = position.xz;
    ripplePosition.y = floorPosition;

    rippleTime.x = 1;

    position.x = instanceIndex.add(timer).hash().mul(100).add(-50);
    position.z = instanceIndex.add(timer.add(randU32())).hash().mul(100).add(-50);
  });

  const rippleOnSurface = texture(collisionPostprocessTarget.texture, getCoord(ripplePosition.xz));

  const rippleFloorArea = rippleOnSurface.y.add(surfaceOffset);

  NodeStack.if(ripplePosition.y.greaterThan(rippleFloorArea), () => {
    rippleTime.x = 1000;
  });
})().compute(maxCount);

const rain = createRainParticles();
const ripples = createRainRipples();
const plane = createFloor();
const roof = createRoof();
const suzanne = await loadSuzanne();
const camera = createCamera();
const collisionCamera = createCollisionCamera();
const scene = new Scene();
scene.add(camera, createDirectionalLight(), createAmbientLight(), rain, ripples, plane, roof, suzanne);

const clock = Clock.new();
const hearth = await Hearth.as({
  async animate() {
    const delta = clock.tick();
    suzanne.rotateY(delta);

    collisionPostprocessPosition.set(state.position.x, state.position.y, -state.position.z);
    roof.position.lerp(collisionPostprocessPosition, 10 * delta);

    scene.overrideMaterial = collisionPostprocessMaterial;
    hearth.updateRenderTarget(collisionPostprocessTarget);
    await hearth.render(scene, collisionCamera);

    await hearth.compute(onUpdate);

    scene.overrideMaterial = null;
    hearth.updateRenderTarget(null);
    await hearth.render(scene, camera);
  },
});

await hearth.compute(onInit);
OrbitControls.attach(hearth, camera);
useWindowResizer(hearth, camera);

const state = {
  position: Vec3.from(roof.position),
  scale: roof.scale,
  count: ripples.count,
};

MiniUi.create('Controls', state)
  .number('position.z', 'Roof position', -50, 50, 0.01)
  .number('scale.x', 'Roof scale', 0.1, 3.5, 0.01)
  .number('count', 'Drop count', 200, maxCount, 1, count => {
    ripples.count = count;
    rain.count = count;
  });
