import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  mix,
  positionLocal,
  range,
  SpriteNodeMaterial,
  texture,
  timerLocal,
  uv,
} from '@modules/renderer/engine/nodes/nodes.js';

import { GUI } from 'lil-gui';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { Blending } from '@modules/renderer/engine/engine.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { UI } from '../../../../../mini-ui';

let camera, scene, hearth;
let controls;

init();

async function init() {
  const { innerWidth, innerHeight } = window;

  camera = new Engine.PerspectiveCamera(60, innerWidth / innerHeight, 1, 5000);
  camera.position.set(1300, 500, 0);

  scene = new Engine.Scene();
  //scene.fogNode = rangeFog( color( 0x0000ff ), 1500, 2100 );

  const textureLoader = new TextureLoader();
  const map = await textureLoader.loadAsync('resources/textures/opengameart/smoke1.png');

  const lifeRange = range(0.1, 1);
  const offsetRange = range(new Engine.Vec3(-2, 3, -2), new Engine.Vec3(2, 5, 2));

  const timer = timerLocal(0.2, 1);

  const lifeTime = timer.mul(lifeRange).mod(1);
  const scaleRange = range(0.3, 2);
  const rotateRange = range(0.1, 4);

  const life = lifeTime.div(lifeRange);

  const fakeLightEffect = positionLocal.y.oneMinus().max(0.2);

  const textureNode = texture(map, uv().rotateUV(timer.mul(rotateRange)));

  const opacityNode = textureNode.a.mul(life.oneMinus());

  const smokeColor = mix(color(0x2c1501), color(0x222222), positionLocal.y.mul(3).clamp());

  const smokeNodeMaterial = new SpriteNodeMaterial();
  smokeNodeMaterial.colorNode = mix(color(0xf27d0c), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
  smokeNodeMaterial.opacityNode = opacityNode;
  smokeNodeMaterial.positionNode = offsetRange.mul(lifeTime);
  smokeNodeMaterial.scaleNode = scaleRange.mul(lifeTime.max(0.3));
  smokeNodeMaterial.depthWrite = false;
  smokeNodeMaterial.transparent = true;

  const smokeInstancedSprite = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), smokeNodeMaterial);
  smokeInstancedSprite.scale.setScalar(400);
  smokeInstancedSprite.isInstancedMesh = true;
  smokeInstancedSprite.count = 2000;
  scene.add(smokeInstancedSprite);

  const fireNodeMaterial = new SpriteNodeMaterial();
  fireNodeMaterial.colorNode = mix(color(0xb72f17), color(0xb72f17), life);
  fireNodeMaterial.positionNode = range(new Engine.Vec3(-1, 1, -1), new Engine.Vec3(1, 2, 1)).mul(lifeTime);
  fireNodeMaterial.scaleNode = smokeNodeMaterial.scaleNode;
  fireNodeMaterial.opacityNode = opacityNode;
  fireNodeMaterial.blending = Engine.Blending.Additive;
  fireNodeMaterial.transparent = true;
  fireNodeMaterial.depthWrite = false;

  const fireInstancedSprite = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), fireNodeMaterial);
  fireInstancedSprite.scale.setScalar(400);
  fireInstancedSprite.isInstancedMesh = true;
  fireInstancedSprite.count = 100;
  fireInstancedSprite.position.y = -100;
  fireInstancedSprite.renderOrder = 1;
  scene.add(fireInstancedSprite);

  const helper = new Engine.GridHelper(3000, 40, 0x303030, 0x303030);
  helper.position.y = -75;
  scene.add(helper);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = render;
  document.body.appendChild(hearth.parameters.canvas);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.maxDistance = 2700;
  controls.target.set(0, 500, 0);
  controls.update();

  useWindowResizer(hearth, camera);

  UI.create('Controls', timer).number('scale', 'Animation speed', 0.2, 1, 0.01);
}

function render() {
  hearth.render(scene, camera);
}
