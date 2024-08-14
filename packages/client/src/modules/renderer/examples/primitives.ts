import { WindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { normalLocal, normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  AmbientLight,
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  ConvexGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshLambertMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  PointsGeometry,
  PolyhedronGeometry,
  RingGeometry,
  RoundedBoxGeometry,
  ShapeGeometry,
  SphereGeometry,
  TeapotGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  TubeGeometry,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { MeshStandardNodeMaterial } from '@modules/renderer/engine/nodes/materials/MeshStandardNodeMaterial.js';
import { timerLocal } from '@modules/renderer/engine/nodes/utils/TimerNode.js';

const container = document.createElement('div');
document.body.appendChild(container);

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(10, 8, 5);
  camera.lookAt(0, 0, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.backgroundNode = normalWorld.y.mix(color(0x0f00a5), color(0x0f0fbc));
  return scene;
};

const creatAmbientLight = () => {
  return new AmbientLight(0xffffff, 20);
};

const createGround = () => {
  const geometry = new BoxGeometry({ width: 100, height: 0.1, depth: 100 });
  const material = new MeshLambertMaterial({ color: 0x212121 });
  const mesh = new Mesh(geometry, material);

  mesh.position.set(0, -1, 0);
  return mesh;
};

const createGeometries = () => {
  const box = new BoxGeometry();
  const capsule = new CapsuleGeometry();
  const circle = new CircleGeometry();
  const cone = new ConeGeometry();
  const convex = new ConvexGeometry();
  const cylinder = new CylinderGeometry();
  const dodecahedron = new DodecahedronGeometry();
  const icosahedron = new IcosahedronGeometry();
  const lathe = new LatheGeometry();
  const octahedron = new OctahedronGeometry();
  const plane = new PlaneGeometry();
  const points = new PointsGeometry();
  const polyhedron = new PolyhedronGeometry();
  const ring = new RingGeometry();
  const roundedBox = new RoundedBoxGeometry();
  const shape = new ShapeGeometry();
  const sphere = new SphereGeometry();
  const teapot = new TeapotGeometry();
  const tetrahedron = new TetrahedronGeometry();
  const torus = new TorusGeometry();
  const torusKnot = new TorusKnotGeometry();
  const tube = new TubeGeometry();

  const geometries = [
    box,
    capsule,
    circle,
    cone,
    convex,
    cylinder,
    dodecahedron,
    icosahedron,
    lathe,
    octahedron,
    plane,
    points,
    polyhedron,
    ring,
    roundedBox,
    shape,
    sphere,
    teapot,
    tetrahedron,
    torus,
    torusKnot,
    tube,
  ];

  const meshes = geometries.map(geometry => {
    const material = new MeshStandardNodeMaterial();

    const timer = timerLocal(0.2);
    material.colorNode = normalLocal.rgb.div(4).rotate(timer);

    return new Mesh(geometry, material);
  });

  meshes.forEach((mesh, index) => {
    const x = (index % 5) * 2;
    const z = Math.floor(index / 5) * 2;

    mesh.position.set(x, Math.random() * 2, z);
  });

  const center = meshes.length / 4;
  meshes.forEach(mesh => {
    mesh.position.x -= center;
    mesh.position.z -= center;
  });

  return meshes;
};

const camera = createCamera();
const ground = createGround();
const scene = createScene();
const light = creatAmbientLight();
const meshes = createGeometries();

scene.add(camera, ground, light, ...meshes);

const hearth = await Hearth.as({ useAntialias: true });
WindowResizer.attach(hearth, camera);
OrbitControls.attach(hearth, camera);
scene.attach(hearth, camera);
hearth.animation.loop = (delta, _, { total }) => {
  for (const mesh of meshes) {
    mesh.rotateY(delta);
    mesh.rotateZ(delta);
  }

  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    mesh.position.y = 2 + 1 * Math.sin(total);
  }
};
