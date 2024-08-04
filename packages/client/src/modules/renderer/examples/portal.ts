import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  MeshBasicNodeMaterial,
  normalWorld,
  pass,
  timerLocal,
  toneMapping,
  uv,
  vec2,
  viewportTopLeft,
  Noise,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, sceneMain, scenePortal, hearth;
let clock;

const mixers = [];

init();

async function init() {
  sceneMain = new Engine.Scene();
  sceneMain.background = new Engine.Color(0x222222);
  sceneMain.backgroundNode = normalWorld.y.mix(color(0x0066ff), color(0xff0066));

  scenePortal = new Engine.Scene();
  scenePortal.backgroundNode = Noise.worley
    .f32(normalWorld.mul(20).add(vec2(0, timerLocal().oneMinus())))
    .mul(color(0x0066ff));

  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 30);
  camera.position.set(2.5, 1, 3);
  camera.position.scale(0.8);
  camera.lookAt(0, 1, 0);

  clock = new Engine.Clock();

  const light = new Engine.PointLight(0xffffff, 1);
  light.position.set(0, 1, 5);
  light.power = 17000;

  sceneMain.add(new Engine.HemisphereLight(0xff0066, 0x0066ff, 7));
  sceneMain.add(light);
  scenePortal.add(light.clone());

  const geometry = new Engine.PlaneGeometry(1.7, 2);

  const material = new MeshBasicNodeMaterial();
  material.colorNode = pass(scenePortal, camera).context({ getUV: () => viewportTopLeft });
  material.opacityNode = uv().distance(0.5).remapClamp(0.3, 0.5).oneMinus();
  material.side = Engine.Side.Double;
  material.transparent = true;

  const plane = new Engine.Mesh(geometry, material);
  plane.position.set(0, 1, 0.8);
  sceneMain.add(plane);

  const loader = new GLTFLoader();
  await loader.loadAsync('resources/models/gltf/Xbot.glb').then(function (gltf) {
    const createModel = (colorNode = null) => {
      let object;

      if (mixers.length === 0) {
        object = gltf.scene;
      } else {
        object = gltf.scene.clone();

        const children = object.children[0].children;

        const applyFX = index => {
          children[index].material = children[index].material.clone();
          children[index].material.colorNode = colorNode;
          children[index].material.wireframe = true;
        };

        applyFX(0);
        applyFX(1);
      }

      const mixer = new Engine.AnimationMixer(object);

      const action = mixer.clipAction(gltf.animations[6]);
      action.play();

      mixers.push(mixer);

      return object;
    };

    const colorNode = Noise.fractal.vec3(uv().mul(20).add(timerLocal()));

    const modelMain = createModel();
    const modelPortal = createModel(colorNode);

    sceneMain.add(modelMain);
    scenePortal.add(modelPortal);
  });

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  hearth.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 0.15);
  document.body.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.target.set(0, 1, 0);
  controls.update();

  useWindowResizer(hearth, camera);
}

function animate() {
  const delta = clock.tick();

  for (const mixer of mixers) {
    mixer.update(delta);
  }

  hearth.render(sceneMain, camera);
}
