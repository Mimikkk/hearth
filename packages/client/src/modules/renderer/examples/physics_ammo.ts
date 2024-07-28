import { AmmoPhysics } from '@modules/renderer/engine/physics/AmmoPhysics.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { HemisphereLight } from '@modules/renderer/engine/entities/lights/HemisphereLight.js';
import { DirectionalLight } from '@modules/renderer/engine/entities/lights/DirectionalLight.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';
import { ShadowMaterial } from '@modules/renderer/engine/entities/materials/ShadowMaterial.js';
import { MeshLambertMaterial } from '@modules/renderer/engine/entities/materials/MeshLambertMaterial.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { InstancedMesh } from '@modules/renderer/engine/entities/InstancedMesh.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { BufferUse } from '@modules/renderer/engine/constants.js';
import { IcosahedronGeometry } from '@modules/renderer/engine/entities/geometries/IcosahedronGeometry.js';

const physics = await AmmoPhysics();
const position = Vec3.new();

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(-1, 1.5, 2);
camera.lookAt(0, 0.5, 0);

const scene = new Scene();
scene.background = Color.new(0x666666);

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

const material = new MeshLambertMaterial();

const matrix = new Mat4();
const color = Color.new();

const geometryBox = new BoxGeometry(0.075, 0.075, 0.075);
const boxes = new InstancedMesh(geometryBox, material, 2);
boxes.instanceMatrix.usage = BufferUse.DynamicDraw;

boxes.userData.physics = { mass: 1 };
scene.add(boxes);

for (let i = 0; i < boxes.count; i++) {
  matrix.setPosition(Vec3.new(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5));
  boxes.setMatrixAt(i, matrix);
  boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
}

const geometrySphere = new IcosahedronGeometry(0.05, 4);
const spheres = new InstancedMesh(geometrySphere, material, 2);
spheres.instanceMatrix.usage = BufferUse.DynamicDraw;

spheres.castShadow = true;
spheres.receiveShadow = true;
spheres.userData.physics = { mass: 1 };
scene.add(spheres);

for (let i = 0; i < spheres.count; i++) {
  matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
  spheres.setMatrixAt(i, matrix);
  spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));
}

physics.addScene(scene);

const hearth = await Hearth.as({ antialias: true, alpha: true });
hearth.setSize(window.innerWidth, window.innerHeight);
hearth.animation.loop = animate;
document.body.appendChild(hearth.parameters.canvas);

const controls = new OrbitControls(camera, hearth.parameters.canvas);
controls.target.y = 0.5;
controls.update();

setInterval(() => {
  let index = Math.floor(Math.random() * boxes.count);

  position.set(0, Math.random() + 1, 0);
  physics.setMeshPosition(boxes, position, index);
}, 1000 / 60);

function animate() {
  hearth.render(scene, camera);
}
