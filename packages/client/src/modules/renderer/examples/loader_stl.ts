import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { Vec3 } from '../engine/math/Vec3.js';
import { Scene } from '@modules/renderer/engine/objects/scenes/Scene';
import { Color } from '../engine/math/Color';
import { Fog } from '@modules/renderer/engine/objects/scenes/Fog';
import { Mesh } from '../engine/objects/Mesh';
import { PlaneGeometry } from '../engine/geometries/PlaneGeometry';
import { MeshPhongMaterial } from '@modules/renderer/engine/objects/materials/MeshPhongMaterial';
import { STLLoader } from '@modules/renderer/engine/loaders/objects/STLLoader/STLLoader.js';
import { HemisphereLight } from '@modules/renderer/engine/objects/lights/HemisphereLight';
import { DirectionalLight } from '@modules/renderer/engine/objects/lights/DirectionalLight';
import { Renderer } from '../engine/renderers/Renderer.js';

let container;

let camera, cameraTarget, scene, renderer;

init();

async function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 15);
  camera.position.set(3, 0.15, 3);

  cameraTarget = Vec3.new(0, -0.25, 0);

  scene = new Scene();
  scene.background = Color.new(0x72645b);
  scene.fog = new Fog(0x72645b, 2, 15);

  // Ground

  const plane = new Mesh(new PlaneGeometry(40, 40), new MeshPhongMaterial({ color: 0xcbcbcb, specular: 0x474747 }));
  plane.setRotationX(-Math.PI / 2);
  plane.position.y = -0.5;
  scene.add(plane);

  plane.receiveShadow = true;

  // ASCII file
  const loader = new STLLoader();
  loader.loadAsync('resources/models/stl/ascii/slotted_disk.stl').then(function (geometry) {
    const material = new MeshPhongMaterial({ color: 0xff9c7c, specular: 0x494949, shininess: 200 });
    const mesh = new Mesh(geometry, material);

    mesh.position.set(0, -0.25, 0.6);
    mesh.setRotation(0, -Math.PI / 2, 0);
    mesh.scale.set(0.5, 0.5, 0.5);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  });

  // Binary files
  const material = new MeshPhongMaterial({ color: 0xd5d5d5, specular: 0x494949, shininess: 200 });

  loader.loadAsync('resources/models/stl/binary/pr2_head_pan.stl').then(function (geometry) {
    const mesh = new Mesh(geometry, material);

    mesh.position.set(0, -0.37, -0.6);
    mesh.setRotation(-Math.PI / 2, 0, 0);
    mesh.scale.set(2, 2, 2);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  });

  loader.loadAsync('resources/models/stl/binary/pr2_head_tilt.stl').then(function (geometry) {
    const mesh = new Mesh(geometry, material);

    mesh.position.set(0.136, -0.37, -0.6);
    mesh.setRotation(-Math.PI / 2, 0.3, 0);
    mesh.scale.set(2, 2, 2);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  });

  // Colored binary STL
  loader.loadAsync('resources/models/stl/binary/colored.stl').then(function (geometry) {
    let meshMaterial = material;

    if (geometry.hasColors) {
      meshMaterial = new MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
    }

    const mesh = new Mesh(geometry, meshMaterial);

    mesh.position.set(0.5, 0.2, 0);
    mesh.setRotation(-Math.PI / 2, Math.PI / 2, 0);
    mesh.scale.set(0.3, 0.3, 0.3);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  });

  // Lights

  scene.add(new HemisphereLight(0x8d7c7c, 0x494966, 3));

  addShadowedLight(1, 1, 1, 0xffffff, 3.5);
  addShadowedLight(0.5, 1, -1, 0xffd500, 3);
  // renderer

  renderer = await Renderer.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;

  // renderer.shadowMap.enabled = true;

  container.appendChild(renderer.parameters.canvas);

  // stats

  //

  window.addEventListener('resize', onWindowResize);
}

function addShadowedLight(x, y, z, color, intensity) {
  const directionalLight = new DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  scene.add(directionalLight);

  directionalLight.castShadow = true;

  const d = 1;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 4;

  directionalLight.shadow.bias = -0.002;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  render();
}

function render() {
  const timer = Date.now() * 0.0005;

  camera.position.x = Math.cos(timer) * 3;
  camera.position.z = Math.sin(timer) * 3;

  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
}
