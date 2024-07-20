import { AmmoPhysics } from '@modules/renderer/engine/physics/AmmoPhysics.ts';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.ts';
import { Vector3 } from '@modules/renderer/engine/math/Vector3.ts';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.ts';
import { Scene } from '@modules/renderer/engine/scenes/Scene.ts';
import { Color } from '@modules/renderer/engine/math/Color.ts';
import { HemisphereLight } from '@modules/renderer/engine/lights/HemisphereLight.ts';
import { DirectionalLight } from '@modules/renderer/engine/lights/DirectionalLight.ts';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.ts';
import { BoxGeometry } from '@modules/renderer/engine/geometries/BoxGeometry.ts';
import { ShadowMaterial } from '@modules/renderer/engine/materials/ShadowMaterial.ts';
import { MeshLambertMaterial } from '@modules/renderer/engine/materials/MeshLambertMaterial.ts';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.ts';
import { InstancedMesh } from '@modules/renderer/engine/objects/InstancedMesh.ts';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.ts';
import { IcosahedronGeometry } from '@modules/renderer/engine/geometries/IcosahedronGeometry.ts';
import { BufferUsage } from '@modules/renderer/engine/constants.ts';
import Stats from 'stats-js';

const physics = await AmmoPhysics();
const position = new Vector3();

//

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(-1, 1.5, 2);
camera.lookAt(0, 0.5, 0);

const scene = new Scene();
scene.background = new Color(0x666666);

const hemiLight = new HemisphereLight();
scene.add(hemiLight);

const dirLight = new DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 5, 5);
dirLight.castShadow = false;
dirLight.shadow.camera.zoom = 2;
scene.add(dirLight);

const floor = new Mesh(new BoxGeometry(10, 5, 10), new ShadowMaterial({ color: 0x444444 }));
floor.position.y = -2.5;
floor.receiveShadow = false;
floor.userData.physics = { mass: 0 };
scene.add(floor);

//

const material = new MeshLambertMaterial();

const matrix = new Matrix4();
const color = new Color();

// Boxes

const geometryBox = new BoxGeometry(0.075, 0.075, 0.075);
const boxes = new InstancedMesh(geometryBox, material, 2);
boxes.instanceMatrix.setUsage(BufferUsage.DynamicDraw); // will be updated every frame
// boxes.castShadow = false;
// boxes.receiveShadow = false;
boxes.userData.physics = { mass: 1 };
scene.add(boxes);

for (let i = 0; i < boxes.count; i++) {
  matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
  boxes.setMatrixAt(i, matrix);
  boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
}

// // Spheres
//
// const geometrySphere = new IcosahedronGeometry(0.05, 4);
// const spheres = new InstancedMesh(geometrySphere, material, 2);
// spheres.instanceMatrix.setUsage(BufferUsage.DynamicDraw); // will be updated every frame
// spheres.castShadow = true;
// spheres.receiveShadow = true;
// spheres.userData.physics = { mass: 1 };
// scene.add(spheres);
//
// for (let i = 0; i < spheres.count; i++) {
//   matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
//   spheres.setMatrixAt(i, matrix);
//   spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));
// }

physics.addScene(scene);

//

const renderer = await Renderer.create({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.parameters.canvas);

const stats = new Stats();
document.body.appendChild(stats.dom);

//

const controls = new OrbitControls(camera, renderer.parameters.canvas);
controls.target.y = 0.5;
controls.update();

setInterval(() => {
  let index = Math.floor(Math.random() * boxes.count);

  position.set(0, Math.random() + 1, 0);
  physics.setMeshPosition(boxes, position, index);

  //

  // index = Math.floor(Math.random() * spheres.count);

  // position.set(0, Math.random() + 1, 0);
  // physics.setMeshPosition(spheres, position, index);
}, 1000 / 60);

function animate() {
  renderer.render(scene, camera);

  stats.update();
}
