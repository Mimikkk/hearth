import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Fog } from '@modules/renderer/engine/entities/scenes/Fog.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { PlaneGeometry } from '../engine/geometries/PlaneGeometry.js';
import { MeshPhongMaterial } from '@modules/renderer/engine/entities/materials/MeshPhongMaterial.js';
import { HemisphereLight } from '@modules/renderer/engine/entities/lights/HemisphereLight.js';
import { SpotLight } from '@modules/renderer/engine/entities/lights/SpotLight.js';
import { MeshStandardMaterial } from '@modules/renderer/engine/entities/materials/MeshStandardMaterial.js';
import { DRACOLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/DRACOLoader.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { FileLoader } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';

let camera, scene, hearth;

const container = document.querySelector('#container');

const dracoLoader = new DRACOLoader();

init();

async function init() {
  camera = new PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 15);
  camera.position.set(3, 0.25, 3);

  scene = new Scene();
  scene.background = Color.new(0x443333);
  scene.fog = new Fog(0x443333, 1, 4);

  const plane = new Mesh(new PlaneGeometry(8, 8), new MeshPhongMaterial({ color: 0xcbcbcb, specular: 0x101010 }));
  plane.setRotationX(-Math.PI / 2);
  plane.position.y = 0.03;
  plane.useShadowReceive = true;
  scene.add(plane);

  const hemiLight = new HemisphereLight(0x8d7c7c, 0x494966, 3);
  scene.add(hemiLight);

  const spotLight = new SpotLight();
  spotLight.intensity = 7;
  spotLight.angle = Math.PI / 16;
  spotLight.penumbra = 0.5;
  spotLight.useShadowCast = true;
  spotLight.position.set(-1, 1, 1);
  scene.add(spotLight);

  dracoLoader.loadAsync('resources/models/draco/bunny.drc').then(function (geometry) {
    geometry.computeVertexNormals();

    const material = new MeshStandardMaterial({ color: 0xa5a5a5 });
    const mesh = new Mesh(geometry, material);
    mesh.useShadowCast = true;
    mesh.useShadowReceive = true;
    scene.add(mesh);

    dracoLoader.dispose();
  });

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  container.appendChild(hearth.parameters.canvas);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  hearth.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const timer = Date.now() * 0.0003;

  camera.position.x = Math.sin(timer) * 0.5;
  camera.position.z = Math.cos(timer) * 0.5;
  camera.lookAt(0, 0.1, 0);

  hearth.render(scene, camera);
}
