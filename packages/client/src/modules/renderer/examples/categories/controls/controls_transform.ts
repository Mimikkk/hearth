import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { AmbientLight } from '@modules/renderer/engine/entities/lights/AmbientLight.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { MeshLambertMaterial } from '@modules/renderer/engine/entities/materials/MeshLambertMaterial.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { OrthographicCamera } from '@modules/renderer/engine/entities/cameras/OrthographicCamera.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { GridVisualizer } from '@modules/renderer/engine/entities/visualizers/GridVisualizer.js';
import { DirectionalLight } from '@modules/renderer/engine/entities/lights/DirectionalLight.ts';
import { ColorSpace } from '@modules/renderer/engine/constants.ts';
import { degreeToRadian } from '@modules/renderer/engine/math/MathUtils.js';
import { TransformControls } from '@modules/renderer/engine/entities/controls/TransformControls.js';

const renderer = await Hearth.as();
const aspect = window.innerWidth / window.innerHeight;

const frustumSize = 5;

const cameraPersp = new PerspectiveCamera(50, aspect, 0.1, 100);
const cameraOrtho = new OrthographicCamera(
  -frustumSize * aspect,
  frustumSize * aspect,
  frustumSize,
  -frustumSize,
  0.1,
  100,
);
let currentCamera = cameraPersp;

currentCamera.position.set(5, 2.5, 5);

const scene = new Scene();
scene.add(new GridVisualizer({ size: 5, divisions: 10, centerColor: 0x888888, lineColor: 0x444444 }));

const ambientLight = new AmbientLight(0xffffff);
scene.add(ambientLight);

const light = new DirectionalLight(0xffffff, 4);
light.position.set(1, 1, 1);
scene.add(light);

const geometry = new BoxGeometry();
const material = new MeshLambertMaterial();

const orbit = new OrbitControls(currentCamera, renderer.parameters.canvas);
orbit.update();
orbit.onChange = render;

const control = new TransformControls(currentCamera, renderer.parameters.canvas);
// control.addEventListener('change', render);
// control.addEventListener('dragging-changed', function (event) {
//   orbit.enabled = !event.value;
// });

const mesh = new Mesh(geometry, material);
scene.add(mesh);

control.attach(mesh);
scene.add(control);

window.addEventListener('resize', onWindowResize);

window.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'q':
      control.setSpace(control.space === 'local' ? 'world' : 'local');
      break;
    case 'Shift':
      control.setTranslationSnap(1);
      control.setRotationSnap(degreeToRadian(15));
      control.setScaleSnap(0.25);
      break;
    case 'w':
      control.setMode('translate');
      break;
    case 'e':
      control.setMode('rotate');
      break;
    case 'r':
      control.setMode('scale');
      break;
    case 'c':
      const position = currentCamera.position.clone();

      currentCamera = currentCamera.isPerspectiveCamera ? cameraOrtho : cameraPersp;
      currentCamera.position.from(position);

      orbit.camera = currentCamera;
      control.camera = currentCamera;

      currentCamera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
      onWindowResize();
      break;
    case 'v':
      const randomFoV = Math.random() + 0.1;
      const randomZoom = Math.random() + 0.1;

      cameraPersp.fov = randomFoV * 160;
      cameraOrtho.bottom = -randomFoV * 500;
      cameraOrtho.top = randomFoV * 500;

      cameraPersp.zoom = randomZoom * 5;
      cameraOrtho.zoom = randomZoom * 5;
      onWindowResize();
      break;
    case '+':
    case '=':
      control.setSize(control.size + 0.1);
      break;
    case '-':
    case '_':
      control.setSize(Math.max(control.size - 0.1, 0.1));
      break;
    case 'x':
      control.showX = !control.showX;
      break;
    case 'y':
      control.showY = !control.showY;
      break;
    case 'z':
      control.showZ = !control.showZ;
      break;
    case ' ':
      control.enabled = !control.enabled;
      break;

    case 'Escape':
      control.reset();
      break;
  }
});

window.addEventListener('keyup', event => {
  switch (event.key) {
    case 'Shift':
      control.setTranslationSnap(null!);
      control.setRotationSnap(null!);
      control.setScaleSnap(null!);
      break;
  }
});

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;

  cameraPersp.aspect = aspect;
  cameraPersp.updateProjectionMatrix();

  cameraOrtho.left = cameraOrtho.bottom * aspect;
  cameraOrtho.right = cameraOrtho.top * aspect;
  cameraOrtho.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, currentCamera);
}

render();
