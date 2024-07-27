import * as Engine from '@modules/renderer/engine/engine.js';
import { TTFLoader } from '@modules/renderer/engine/loaders/fonts/TTFLoader/TTFLoader.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { TextGeometry } from '@modules/renderer/engine/objects/geometries/TextGeometry.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { FontManager } from '@modules/renderer/engine/loaders/fonts/FontManager.js';

let camera, cameraTarget, scene, renderer;
let group, textMesh1, textMesh2, textGeo, material;
let firstLetter = true;

let text = 'penumbra';
const depth = 20,
  size = 70,
  hover = 30,
  curveSegments = 4,
  bevelThickness = 2,
  bevelSize = 1.5;

let font = null;
const mirror = true;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;

init();

async function init() {
  // CAMERA

  const width = window.innerWidth;
  const height = window.innerHeight;
  camera = new Engine.PerspectiveCamera(60, width / height, 1, 2100);
  camera.position.set(0, 400, 700);

  cameraTarget = new Engine.Vec3(0, 150, 0);

  // SCENE

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x000000);
  scene.fog = new Engine.Fog(0x000000, 250, 1400);

  // LIGHTS

  const dirLight1 = new Engine.DirectionalLight(0xffffff, 0.4);
  dirLight1.position.set(0, 0, 1).normalize();
  scene.add(dirLight1);

  const dirLight2 = new Engine.DirectionalLight(0xffffff, 2);
  dirLight2.position.set(0, hover, 10).normalize();
  dirLight2.color.setHSL(Math.random(), 1, 0.5, Engine.ColorSpace.SRGB);
  scene.add(dirLight2);

  material = new Engine.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

  group = new Engine.Group();
  group.position.y = 100;

  scene.add(group);

  const loader = new TTFLoader();
  loader.loadAsync('resources/fonts/kenpixel.ttf').then(json => {
    font = new FontManager(json);

    createText();
  });

  const plane = new Engine.Mesh(
    new Engine.PlaneGeometry(10000, 10000),
    new Engine.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }),
  );
  plane.position.y = 100;
  plane.setRotationX(-Math.PI / 2);
  scene.add(plane);

  // RENDERER

  renderer = await Renderer.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = render;
  document.body.appendChild(renderer.parameters.canvas);

  // EVENTS

  document.body.style.touchAction = 'none';
  document.body.addEventListener('pointerdown', onPointerDown);

  document.addEventListener('keypress', onDocumentKeyPress);
  document.addEventListener('keydown', onDocumentKeyDown);

  useWindowResizer(renderer, camera);
}

function onDocumentKeyDown(event) {
  if (firstLetter) {
    firstLetter = false;
    text = '';
  }

  const keyCode = event.keyCode;

  // backspace

  if (keyCode === 8) {
    event.preventDefault();

    text = text.substring(0, text.length - 1);
    refreshText();

    return false;
  }
}

function onDocumentKeyPress(event) {
  const keyCode = event.which;

  // backspace

  if (keyCode === 8) {
    event.preventDefault();
  } else {
    const ch = String.fromCharCode(keyCode);
    text += ch;

    refreshText();
  }
}

function createText() {
  textGeo = new TextGeometry(text, {
    font: font,

    size: size,
    depth: depth,
    curveSegments: curveSegments,

    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelEnabled: true,
  });

  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();

  const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

  textMesh1 = new Engine.Mesh(textGeo, material);

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = hover;
  textMesh1.position.z = 0;

  textMesh1.setRotationX(0);
  textMesh1.setRotationY(Math.PI * 2);

  group.add(textMesh1);

  if (mirror) {
    textMesh2 = new Engine.Mesh(textGeo, material);

    textMesh2.position.x = centerOffset;
    textMesh2.position.y = -hover;
    textMesh2.position.z = depth;

    textMesh2.setRotationX(Math.PI);
    textMesh2.setRotationY(Math.PI * 2);

    group.add(textMesh2);
  }
}

function refreshText() {
  group.remove(textMesh1);
  if (mirror) group.remove(textMesh2);

  if (!text) return;

  createText();
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  pointerXOnPointerDown = event.clientX - windowHalfX;
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  pointerX = event.clientX - windowHalfX;

  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
}

function onPointerUp() {
  if (event.isPrimary === false) return;

  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
}

//

function render() {
  group.rotateY((targetRotation - group.getRotationY()) * 0.05);

  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
}
