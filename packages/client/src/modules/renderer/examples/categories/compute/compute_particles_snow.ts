import {
  Attribute,
  Buffer,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  MagnificationTextureFilter,
  Mesh,
  MeshStandardMaterial,
  MinificationTextureFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RenderTarget,
  Scene,
  SphereGeometry,
  TextureDataType,
  ToneMapping,
  Vec2,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import {
  color,
  hsl,
  instanceIndex,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Node,
  NodeStack,
  pass,
  positionLocal,
  positionWorld,
  storage,
  StorageBufferNode,
  texture,
  timerLocal,
  TypeName,
  u32,
  vec2,
  vec3,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/nodes.js';

import { TeapotGeometry } from '@modules/renderer/engine/entities/geometries/TeapotGeometry.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { BufferStep, GPUBufferBindingTypeType } from '@modules/renderer/engine/hearth/constants.js';
import { Stats } from '../../ui/stats.js';

const maxCount = 100000;
const createCamera = () => {
  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(20, 2, 20);
  camera.layers.enable(2);
  camera.lookAt(0, 40, 0);

  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(0x0f3c37, 5, 40);
  scene.backgroundNode = viewportTopLeft.distance(0.5).mul(2).mix(color(0x0f4140), color(0x060a0d));

  return scene;
};
const createCollisionCamera = () => {
  const camera = new OrthographicCamera(-50, 50, 50, -50, 0.1, 50);
  camera.position.y = 50;
  camera.lookAt(0, 0, 0);
  camera.layers.enable(1);

  return camera;
};
const createDirectionalLight = () => {
  const light = new DirectionalLight(0xf9ff9b, 9);
  light.castShadow = true;
  light.position.set(10, 10, 0);
  light.castShadow = true;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 30;
  light.shadow.camera.right = 30;
  light.shadow.camera.left = -30;
  light.shadow.camera.top = 30;
  light.shadow.camera.bottom = -30;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.009;

  return light;
};
const createHemisphereLight = () => {
  return new HemisphereLight(0x0f3c37, 0x080d10, 100);
};
const createPostprocess = (scene: Scene, camera: PerspectiveCamera) => {
  const scenepass = pass(scene, camera);

  const color = scenepass.getTextureNode();

  const teapotpass = pass(teapot, camera).getTextureNode();
  const teapotblur = teapotpass.gaussianBlur(3);
  teapotblur.resolution = new Vec2(0.2, 0.2);

  const colorblur = color.gaussianBlur();
  colorblur.resolution = new Vec2(0.5, 0.5);
  colorblur.directionNode = vec2(1);

  const vignette = viewportTopLeft.distance(0.5).mul(1.2).clamp().oneMinus();

  return scenepass.add(colorblur.mul(0.1)).mul(vignette).add(teapotpass.mul(10).add(teapotblur));
};
const createBuffer = (type: TypeName.vec4 | TypeName.vec3) => {
  const stride = type === TypeName.vec4 ? 4 : 3;
  const buffer = Buffer.f32(maxCount * stride, stride, BufferStep.Instance);

  return storage(Attribute.use(buffer, stride, 0, GPUBufferBindingTypeType.Storage), type, maxCount);
};
const createParticles = (posBuffer: StorageBufferNode, layer: number) => {
  const geometry = new SphereGeometry(surfaceOffset, 5, 5);
  const material = new MeshStandardNodeMaterial({
    color: 0xeeeeee,
    roughness: 0.9,
    metalness: 0,
  });

  material.positionNode = positionLocal.mul(scaleBuffer.toAttribute()).add(posBuffer.toAttribute());

  const particles = new InstancedMesh(geometry, material, maxCount);
  particles.castShadow = true;
  particles.layers.disableAll();
  particles.layers.enable(layer);

  return particles;
};
const createFloor = () => {
  const geometry = new PlaneGeometry(100, 100).rotateX(-Math.PI / 2);
  const material = new MeshStandardMaterial({
    color: 0x0c1e1e,
    roughness: 0.5,
    metalness: 0,
    transparent: true,
  });
  material.opacityNode = positionLocal.xz.mul(0.05).distance(0).saturate().oneMinus();

  return new Mesh(geometry, material);
};
const createTree = (count: number = 8): Group => {
  const material = new MeshStandardNodeMaterial({
    color: 0x0d492c,
    roughness: 0.6,
    metalness: 0,
  });

  const cones = new Group();
  for (let i = 0; i < count; ++i) {
    const radius = 1 + i;

    const geometry = new ConeGeometry(radius * 0.95, radius * 1.25, 32);

    const cone = new Mesh(geometry, material);
    cone.castShadow = true;
    cone.position.y = (count - i) * 1.5 + count * 0.6;

    cones.add(cone);
  }

  const geometry = new CylinderGeometry(1, 1, count, 32);
  const cone = new Mesh(geometry, material);
  cone.position.y = count / 2;
  cones.add(cone);

  return cones;
};
const createTeapot = () => {
  const geometry = new TeapotGeometry(0.5, 18);
  const material = new MeshBasicNodeMaterial({ color: 0xfcfb9e });

  const teapot = new Mesh(geometry, material);
  teapot.position.y = 18;

  return teapot;
};

const camera = createCamera();
const directionalLight = createDirectionalLight();
const hemisphereLight = createHemisphereLight();
const collisionCamera = createCollisionCamera();

const collisionPostprocessTarget = new RenderTarget(1024, 1024);
collisionPostprocessTarget.texture.type = TextureDataType.HalfFloat;
collisionPostprocessTarget.texture.magFilter = MagnificationTextureFilter.Nearest;
collisionPostprocessTarget.texture.minFilter = MinificationTextureFilter.Nearest;
const collisionPostprocessMaterial = new MeshBasicNodeMaterial();
collisionPostprocessMaterial.fog = false;
collisionPostprocessMaterial.toneMapped = false;
collisionPostprocessMaterial.colorNode = positionWorld.y;

const dynamicPositionBuffer = createBuffer(TypeName.vec3);
const scaleBuffer = createBuffer(TypeName.vec3);
const staticPositionBuffer = createBuffer(TypeName.vec3);
const dataBuffer = createBuffer(TypeName.vec4);

const timer = timerLocal();
const randu32 = () => u32(Math.random() * 0xffffff);

const onInit = hsl(() => {
  const position = dynamicPositionBuffer.element(instanceIndex);
  const scale = scaleBuffer.element(instanceIndex);
  const particleData = dataBuffer.element(instanceIndex);

  const randX = instanceIndex.hash();
  const randY = instanceIndex.add(randu32()).hash();
  const randZ = instanceIndex.add(randu32()).hash();

  position.x = randX.mul(100).add(-50);
  position.y = randY.mul(500).add(3);
  position.z = randZ.mul(100).add(-50);

  scale.xyz = instanceIndex.add(Math.random()).hash().mul(0.8).add(0.2);

  staticPositionBuffer.element(instanceIndex).assign(vec3(1000, 10000, 1000));

  particleData.y = randY.mul(-0.1).add(-0.02);

  particleData.x = position.x;
  particleData.z = position.z;
  particleData.w = randX;
})().compute(maxCount);

const surfaceOffset = 0.2;
const speed = 0.4;

const onUpdate = hsl(() => {
  const getCoord = (pos: Node) => pos.add(50).div(100);

  const position = dynamicPositionBuffer.element(instanceIndex);
  const scale = scaleBuffer.element(instanceIndex);
  const particleData = dataBuffer.element(instanceIndex);

  const velocity = particleData.y;
  const random = particleData.w;

  const rippleOnSurface = texture(collisionPostprocessTarget.texture, getCoord(position.xz));
  const rippleFloorArea = rippleOnSurface.y.add(scale.x.mul(surfaceOffset));

  NodeStack.if(position.y.greaterThan(rippleFloorArea), () => {
    position.x = particleData.x.add(timer.mul(random.mul(random)).mul(speed).sin().mul(3));
    position.z = particleData.z.add(timer.mul(random).mul(speed).cos().mul(random.mul(10)));

    position.y = position.y.add(velocity);
  }).else(() => {
    staticPositionBuffer.element(instanceIndex).assign(position);
  });
})().compute(maxCount);

const staticParticles = createParticles(staticPositionBuffer, 1);
const dynamicParticles = createParticles(dynamicPositionBuffer, 2);
const plane = createFloor();
const teapot = createTeapot();
const tree = createTree();
const scene = createScene().add(
  directionalLight,
  hemisphereLight,
  dynamicParticles,
  staticParticles,
  plane,
  tree,
  teapot,
);

const hearth = await Hearth.as({
  async animate() {
    stats?.update();
    controls?.update();

    scene.overrideMaterial = collisionPostprocessMaterial;
    hearth.updateRenderTarget(collisionPostprocessTarget);
    await hearth.render(scene, collisionCamera);

    await hearth.compute(onUpdate);

    scene.overrideMaterial = null;
    hearth.updateRenderTarget(null);

    postprocess.render();
  },
  toneMapping: ToneMapping.ACESFilmic,
});

const controls = OrbitControls.attach(hearth, camera, {
  target: Vec3.new(0, 10, 0),
  minDistance: 25,
  maxDistance: 35,
  maxPolarAngle: Math.PI / 1.7,
  autoRotate: true,
  autoRotateSpeed: -0.7,
});
const stats = Stats.attach(hearth);

const postprocess = hearth.postprocess(createPostprocess(scene, camera));

await hearth.compute(onInit);

useWindowResizer(hearth, camera);
